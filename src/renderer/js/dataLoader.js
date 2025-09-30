const { ipcRenderer } = require('electron');

let currentProject = null;
let currentFiles = [];

// 앱 초기화
async function initApp() {
    await loadProjects();
    // UI 상호작용 초기화
    if (window.initializeUIInteractions) {
        window.initializeUIInteractions();
    }
}

// 프로젝트 목록 로딩
async function loadProjects() {
    try {
        const projects = await ipcRenderer.invoke('get-projects');
        
        if (projects.length > 0) {
            renderProjects(projects);
            // 첫 번째 프로젝트 로딩
            await loadProject(projects[0].name);
        }
    } catch (error) {
        console.error('프로젝트 로딩 실패:', error);
    }
}

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
            loadProject(project.name);
        });

        // 더블클릭 이벤트 - 프로젝트 이름 변경
        projectItem.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            editProjectName(projectItem);
        });

        projectList.appendChild(projectItem);
    });
}

// 특정 프로젝트 데이터 로딩
async function loadProject(projectName) {
    try {
        const projectData = await ipcRenderer.invoke('get-project-data', projectName);
        
        if (projectData) {
            currentProject = projectData.project;
            currentFiles = projectData.files;
            
            // UI 업데이트
            updatePinNote();
            updateTabs();
        }
    } catch (error) {
        console.error('프로젝트 데이터 로딩 실패:', error);
    }
}

// Pin Note 업데이트
function updatePinNote() {
    const pinTextarea = document.querySelector('.pin-textarea');
    const pinFile = currentFiles.find(file => file.type === 'pinnote');
    
    if (pinFile) {
        pinTextarea.value = pinFile.content;
    } else {
        pinTextarea.value = '';
    }
}

// 탭들 업데이트
function updateTabs() {
    const tabsNav = document.getElementById('tabs-nav');
    const tabContent = document.getElementById('tab-content');
    
    tabsNav.innerHTML = '';
    tabContent.innerHTML = '';

    // Todo 탭 (항상 첫 번째)
    const todoFile = currentFiles.find(file => file.type === 'todo');
    if (todoFile) {
        createTab('todo', '✅', 'Todo', todoFile.content, true);
    }

    // 메모 탭들
    const memoFiles = currentFiles.filter(file => file.type === 'memo');
    memoFiles.forEach(file => {
        const tabId = file.name.replace('.txt', '');
        const fileName = file.name.replace('.txt', '');
        createTab(tabId, '📝', fileName, file.content, false);
    });
}

// 탭 생성
function createTab(tabId, icon, label, content, isActive) {
    const tabsNav = document.getElementById('tabs-nav');
    const tabContent = document.getElementById('tab-content');

    // 탭 헤더 생성
    const tab = document.createElement('div');
    tab.className = `tab memo-tab ${isActive ? 'active' : ''}`;
    tab.setAttribute('data-tab', tabId);
    tab.dataset.filename = tabId === 'todo' ? 'todo.txt' : `${tabId}.txt`;
    if (tabId !== 'todo') {
        tab.draggable = true;
    }
    tab.innerHTML = `
        <span class="tab-icon">${icon}</span>
        <span class="tab-label memo-name">${label}</span>
        ${tabId !== 'todo' ? '<button class="tab-close">×</button>' : ''}
    `;

    // 탭 클릭 이벤트
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });

    tabsNav.appendChild(tab);

    // 탭 콘텐츠 생성
    const tabPane = document.createElement('div');
    tabPane.className = `tab-pane ${isActive ? 'active' : ''}`;
    tabPane.id = tabId;
    tabPane.innerHTML = `
        <textarea 
            class="content-textarea" 
            spellcheck="false"
        >${content}</textarea>
    `;

    tabContent.appendChild(tabPane);
}

// 윈도우 컨트롤 버튼 기능
function setupWindowControls() {
    document.querySelector('.minimize').addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });

    document.querySelector('.maximize').addEventListener('click', () => {
        ipcRenderer.send('window-maximize');
    });

    document.querySelector('.close').addEventListener('click', () => {
        ipcRenderer.send('window-close');
    });
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    setupWindowControls();
    initApp();
});

// 전역에서 접근 가능하도록 함수들 노출
window.ipcRenderer = ipcRenderer;
window.loadProject = loadProject;

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
            ipcRenderer.invoke('rename-project', currentName, newName)
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
