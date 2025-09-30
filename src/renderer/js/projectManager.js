// 프로젝트 관리 모듈

// 프로젝트 목록 렌더링
function renderProjects(projects) {
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = '';

    projects.forEach((project, index) => {
        const projectItem = document.createElement('div');
        projectItem.className = `project-item project-tab ${index === 0 ? 'active' : ''}`;
        projectItem.draggable = true;
        projectItem.dataset.projectName = project.name;
        projectItem.innerHTML = `
            <div class="project-icon">📁</div>
            <span class="project-name">${project.name}</span>
            <div class="project-indicator"></div>
        `;
        
        projectItem.addEventListener('click', () => {
            // 다른 프로젝트 active 제거
            document.querySelectorAll('.project-item').forEach(item => item.classList.remove('active'));
            projectItem.classList.add('active');
            window.loadProject(project.name);
        });

        // 더블클릭 이벤트 - 프로젝트 이름 변경
        projectItem.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            editProjectName(projectItem);
        });

        projectList.appendChild(projectItem);
    });
}

// 프로젝트 이름 편집
function editProjectName(projectItem) {
    const projectNameSpan = projectItem.querySelector('.project-name');
    const currentName = projectNameSpan.textContent;
    
    // input 요소로 변경
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'project-name-input';
    input.style.cssText = `
        background: transparent;
        border: 1px solid #4a90e2;
        color: inherit;
        font-size: inherit;
        padding: 2px 4px;
        border-radius: 3px;
        width: 100%;
    `;
    
    // span을 input으로 교체
    projectNameSpan.replaceWith(input);
    input.focus();
    input.select();
    
    // 편집 완료 처리
    function finishEdit() {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            // 프로젝트 이름 변경 요청
            window.ipcRenderer.invoke('rename-project', currentName, newName)
                .then(() => {
                    projectItem.dataset.projectName = newName;
                    const newSpan = document.createElement('span');
                    newSpan.className = 'project-name';
                    newSpan.textContent = newName;
                    input.replaceWith(newSpan);
                })
                .catch(error => {
                    console.error('프로젝트 이름 변경 실패:', error);
                    // 실패 시 원래 이름으로 복원
                    const newSpan = document.createElement('span');
                    newSpan.className = 'project-name';
                    newSpan.textContent = currentName;
                    input.replaceWith(newSpan);
                });
        } else {
            // 변경사항 없거나 빈 이름인 경우 원래대로 복원
            const newSpan = document.createElement('span');
            newSpan.className = 'project-name';
            newSpan.textContent = currentName;
            input.replaceWith(newSpan);
        }
    }
    
    // Enter 키 또는 포커스 잃을 때 편집 완료
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishEdit();
        } else if (e.key === 'Escape') {
            // ESC 키로 취소
            const newSpan = document.createElement('span');
            newSpan.className = 'project-name';
            newSpan.textContent = currentName;
            input.replaceWith(newSpan);
        }
    });
    
    input.addEventListener('blur', finishEdit);
}

// 전역에서 접근 가능하도록 함수 노출
window.renderProjects = renderProjects;
window.editProjectName = editProjectName;
