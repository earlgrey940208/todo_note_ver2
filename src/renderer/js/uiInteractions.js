// UI 상호작용 관리 (이름 변경, 드래그&드랍)

let currentEditingElement = null;
let draggedElement = null;
let isFinishingEdit = false; // 중복 실행 방지 플래그

// 초기화
function initializeUIInteractions() {
    setupProjectTabInteractions();
    setupMemoTabInteractions();
    setupDragAndDrop();
    setupNewProjectButton();
}

// 프로젝트 탭 상호작용 설정
function setupProjectTabInteractions() {
    const projectTabs = document.querySelector('.project-list');
    
    if (projectTabs) {
        projectTabs.addEventListener('dblclick', (e) => {
            const projectTab = e.target.closest('.project-tab');
            if (projectTab && !projectTab.classList.contains('active')) {
                startEditingProjectName(projectTab);
            }
        });
    }
}

// 메모 탭 상호작용 설정
function setupMemoTabInteractions() {
    const memoTabs = document.querySelector('#tabs-nav');
    
    if (memoTabs) {
        memoTabs.addEventListener('dblclick', (e) => {
            const memoTab = e.target.closest('.memo-tab');
            if (memoTab && !memoTab.dataset.filename.includes('todo.txt')) {
                startEditingFileName(memoTab);
            }
        });
    }
}

// 새 프로젝트 버튼 설정
function setupNewProjectButton() {
    const newBtn = document.querySelector('.new-btn');
    
    if (newBtn) {
        newBtn.addEventListener('click', () => {
            showNewProjectInput();
        });
    }
}

// 새 프로젝트 입력창 표시
function showNewProjectInput() {
    const projectList = document.querySelector('.project-list');
    
    // 이미 입력창이 있으면 제거
    const existingInput = projectList.querySelector('.new-project-input-container');
    if (existingInput) {
        existingInput.remove();
        return;
    }
    
    // 새 프로젝트 입력 컨테이너 생성
    const inputContainer = document.createElement('div');
    inputContainer.className = 'new-project-input-container';
    inputContainer.innerHTML = `
        <input type="text" class="new-project-input" placeholder="프로젝트 이름 입력" autocomplete="off">
    `;
    
    // 프로젝트 목록 상단에 추가
    projectList.insertBefore(inputContainer, projectList.firstChild);
    
    const input = inputContainer.querySelector('.new-project-input');
    input.focus();
    
    // Enter 키로 프로젝트 생성
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const projectName = input.value.trim();
            if (projectName) {
                const success = await window.createProject(projectName);
                if (success) {
                    inputContainer.remove();
                } else {
                    alert('프로젝트 생성에 실패했습니다. 이미 존재하는 이름이거나 오류가 발생했습니다.');
                }
            }
        } else if (e.key === 'Escape') {
            inputContainer.remove();
        }
    });
    
    // 포커스 잃을 때 제거
    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (inputContainer.parentNode) {
                inputContainer.remove();
            }
        }, 100);
    });
}

// 프로젝트 이름 편집 시작
function startEditingProjectName(projectTab) {
    if (currentEditingElement) return;
    
    const nameSpan = projectTab.querySelector('.project-name');
    const currentName = nameSpan.textContent.trim();
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'edit-input';
    
    nameSpan.style.display = 'none';
    projectTab.appendChild(input);
    
    input.focus();
    input.select();
    
    currentEditingElement = { element: projectTab, input, nameSpan, type: 'project', originalName: currentName };
    
    input.addEventListener('blur', finishEditing);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishEditing();
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    });
}

// 파일 이름 편집 시작
function startEditingFileName(memoTab) {
    if (currentEditingElement) return;
    
    const nameSpan = memoTab.querySelector('.memo-name');
    const currentName = nameSpan.textContent.trim();
    const fileName = memoTab.dataset.filename;
    
    // .txt 확장자 제거
    const nameWithoutExt = fileName.replace('.txt', '');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = nameWithoutExt;
    input.className = 'edit-input';
    
    nameSpan.style.display = 'none';
    memoTab.appendChild(input);
    
    input.focus();
    input.select();
    
    currentEditingElement = { 
        element: memoTab, 
        input, 
        nameSpan, 
        type: 'file', 
        originalName: fileName,
        displayName: currentName 
    };
    
    input.addEventListener('blur', finishEditing);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishEditing();
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    });
}

// 편집 완료
async function finishEditing() {
    if (!currentEditingElement || isFinishingEdit) return;
    
    isFinishingEdit = true; // 실행 중 플래그 설정
    
    const { element, input, nameSpan, type, originalName } = currentEditingElement;
    const newName = input.value.trim();
    
    if (!newName || newName === (type === 'project' ? originalName : originalName.replace('.txt', ''))) {
        cancelEditing();
        isFinishingEdit = false; // 플래그 리셋
        return;
    }
    
    let success = false;
    
    try {
        if (type === 'project') {
            console.log('프로젝트 이름 변경 시도:', originalName, '->', newName);
            success = await window.ipcRenderer.invoke('rename-project', originalName, newName);
            console.log('프로젝트 이름 변경 결과:', success);
            if (success) {
                nameSpan.textContent = newName;
                element.dataset.projectName = newName;
                // 데이터 다시 로드
                if (window.loadProjects) {
                    await window.loadProjects();
                }
            }
        } else if (type === 'file') {
            const currentProject = window.getCurrentProject();
            const newFileName = newName + '.txt';
            
            console.log('현재 프로젝트:', currentProject);
            console.log('메모 파일 이름 변경:', originalName, '->', newFileName);
            
            if (!currentProject) {
                throw new Error('현재 프로젝트를 찾을 수 없습니다.');
            }
            
            success = await window.ipcRenderer.invoke('rename-file', currentProject, originalName, newFileName);
            console.log('파일 이름 변경 결과:', success);
            
            if (success) {
                nameSpan.textContent = newName;
                element.dataset.filename = newFileName;
                // 현재 프로젝트 데이터 다시 로드
                if (window.loadProject) {
                    await window.loadProject(currentProject);
                }
            }
        }
        
        if (!success) {
            alert('이름 변경에 실패했습니다. 같은 이름이 이미 존재하거나 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('이름 변경 중 오류 발생:', error);
        alert(`오류가 발생했습니다: ${error.message}`);
    }
    
    cleanupEditing();
    isFinishingEdit = false; // 플래그 리셋
}

// 편집 취소
function cancelEditing() {
    if (!currentEditingElement) return;
    cleanupEditing();
}

// 편집 정리
function cleanupEditing() {
    if (currentEditingElement) {
        const { input, nameSpan } = currentEditingElement;
        nameSpan.style.display = '';
        input.remove();
        currentEditingElement = null;
    }
}

// 드래그 앤 드랍 설정
function setupDragAndDrop() {
    // 프로젝트 탭 드래그 앤 드랍
    setupProjectDragAndDrop();
    // 메모 탭 드래그 앤 드랍
    setupMemoDragAndDrop();
}

// 프로젝트 드래그 앤 드랍 설정
function setupProjectDragAndDrop() {
    const projectTabs = document.querySelector('.project-list');
    if (!projectTabs) return;
    
    projectTabs.addEventListener('dragstart', (e) => {
        const projectTab = e.target.closest('.project-tab');
        if (projectTab) {
            draggedElement = projectTab;
            projectTab.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });
    
    projectTabs.addEventListener('dragend', (e) => {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
        }
        
        // 모든 drop-target 클래스 제거
        projectTabs.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
    });
    
    projectTabs.addEventListener('dragover', (e) => {
        e.preventDefault();
        const projectTab = e.target.closest('.project-tab');
        if (projectTab && projectTab !== draggedElement) {
            projectTabs.querySelectorAll('.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });
            projectTab.classList.add('drop-target');
        }
    });
    
    projectTabs.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetTab = e.target.closest('.project-tab');
        
        if (targetTab && draggedElement && targetTab !== draggedElement) {
            // 순서 변경 로직 (실제 파일 시스템에서는 구현하지 않음, UI만 변경)
            const parent = targetTab.parentNode;
            const targetRect = targetTab.getBoundingClientRect();
            const draggedRect = draggedElement.getBoundingClientRect();
            
            if (draggedRect.top < targetRect.top) {
                parent.insertBefore(draggedElement, targetTab.nextSibling);
            } else {
                parent.insertBefore(draggedElement, targetTab);
            }
        }
    });
}

// 메모 탭 드래그 앤 드랍 설정
function setupMemoDragAndDrop() {
    const memoTabs = document.querySelector('#tabs-nav');
    if (!memoTabs) return;
    
    memoTabs.addEventListener('dragstart', (e) => {
        const memoTab = e.target.closest('.memo-tab');
        if (memoTab && !memoTab.dataset.filename.includes('todo.txt')) {
            draggedElement = memoTab;
            memoTab.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        } else {
            e.preventDefault(); // todo 탭은 드래그 금지
        }
    });
    
    memoTabs.addEventListener('dragend', (e) => {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
        }
        
        // 모든 drop-target 클래스 제거
        memoTabs.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
    });
    
    memoTabs.addEventListener('dragover', (e) => {
        e.preventDefault();
        const memoTab = e.target.closest('.memo-tab');
        if (memoTab && memoTab !== draggedElement && !memoTab.dataset.filename.includes('todo.txt')) {
            memoTabs.querySelectorAll('.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });
            memoTab.classList.add('drop-target');
        }
    });
    
    memoTabs.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetTab = e.target.closest('.memo-tab');
        
        if (targetTab && draggedElement && targetTab !== draggedElement && !targetTab.dataset.filename.includes('todo.txt')) {
            // todo 탭 위치 보존하면서 순서 변경
            const parent = targetTab.parentNode;
            const todoTab = parent.querySelector('[data-filename*="todo.txt"]');
            
            const targetRect = targetTab.getBoundingClientRect();
            const draggedRect = draggedElement.getBoundingClientRect();
            
            if (draggedRect.top < targetRect.top) {
                parent.insertBefore(draggedElement, targetTab.nextSibling);
            } else {
                parent.insertBefore(draggedElement, targetTab);
            }
            
            // todo 탭을 항상 맨 앞으로
            if (todoTab) {
                parent.insertBefore(todoTab, parent.firstChild);
            }
        }
    });
}

// 전역에서 접근 가능하도록 함수 노출
window.initializeUIInteractions = initializeUIInteractions;
