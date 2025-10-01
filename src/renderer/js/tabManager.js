// 탭 관리 모듈

// 탭들 업데이트
function updateTabs() {
    const tabsNav = document.getElementById('tabs-nav');
    const tabContent = document.getElementById('tab-content');
    
    tabsNav.innerHTML = '';
    tabContent.innerHTML = '';

    // currentFiles를 getter 함수로 접근
    const currentFiles = window.getCurrentFiles();

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

    // 새 메모 탭 추가
    createNewMemoTab();
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
    
    if (tabId === 'todo') {
        // Todo 탭은 체크리스트로 생성
        tabPane.innerHTML = window.createTodoContent(content);
        
        // 체크박스 이벤트 리스너 추가
        setTimeout(() => {
            window.setupTodoCheckboxListeners(tabPane);
            window.setupTodoAddButtonListener(tabPane);
        }, 0);
    } else {
        // 일반 메모 탭은 textarea로 생성
        tabPane.innerHTML = `
            <textarea 
                class="content-textarea" 
                spellcheck="false"
            >${content}</textarea>
        `;
        
        // 메모 textarea에 자동저장 설정
        setTimeout(() => {
            const textarea = tabPane.querySelector('.content-textarea');
            if (textarea && window.setupAutoSave) {
                const fileName = `${tabId}.txt`;
                window.setupAutoSave(textarea, fileName);
            }
        }, 0);
    }

    tabContent.appendChild(tabPane);
}

// 새 메모 탭 생성
function createNewMemoTab() {
    const tabsNav = document.getElementById('tabs-nav');
    
    const newMemoTab = document.createElement('div');
    newMemoTab.className = 'tab new-memo-tab';
    newMemoTab.innerHTML = `
        <span class="tab-icon">+</span>
        <span class="tab-label">새 메모</span>
    `;
    
    // 새 메모 탭 클릭 이벤트
    newMemoTab.addEventListener('click', () => {
        showNewMemoInput(newMemoTab);
    });
    
    tabsNav.appendChild(newMemoTab);
}

// 새 메모 입력창 표시
function showNewMemoInput(newMemoTab) {
    // 이미 입력창이 있으면 제거
    const existingInput = newMemoTab.querySelector('.new-memo-input');
    if (existingInput) {
        // 원래 내용으로 복원
        newMemoTab.innerHTML = `
            <span class="tab-icon">+</span>
            <span class="tab-label">새 메모</span>
        `;
        return;
    }
    
    // 버튼 내용을 입력창으로 교체
    newMemoTab.innerHTML = `
        <input type="text" class="new-memo-input" placeholder="메모 이름 입력" autocomplete="off">
    `;
    
    const input = newMemoTab.querySelector('.new-memo-input');
    input.focus();
    
    // Enter 키로 메모 생성
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const memoName = input.value.trim();
            if (memoName) {
                const success = await createNewMemo(memoName);
                if (success) {
                    // 원래 내용으로 복원
                    newMemoTab.innerHTML = `
                        <span class="tab-icon">+</span>
                        <span class="tab-label">새 메모</span>
                    `;
                } else {
                    alert('메모 생성에 실패했습니다. 이미 존재하는 이름이거나 오류가 발생했습니다.');
                }
            }
        } else if (e.key === 'Escape') {
            // 원래 내용으로 복원
            newMemoTab.innerHTML = `
                <span class="tab-icon">+</span>
                <span class="tab-label">새 메모</span>
            `;
        }
    });
    
    // 포커스 잃을 때 원래 내용으로 복원
    input.addEventListener('blur', () => {
        setTimeout(() => {
            newMemoTab.innerHTML = `
                <span class="tab-icon">+</span>
                <span class="tab-label">새 메모</span>
            `;
        }, 100);
    });
}

// 새 메모 파일 생성
async function createNewMemo(memoName) {
    try {
        const currentProject = window.getCurrentProject();
        if (!currentProject) {
            console.error('현재 프로젝트를 찾을 수 없습니다.');
            return false;
        }
        
        const fileName = memoName + '.txt';
        const success = await window.ipcRenderer.invoke('create-memo-file', currentProject, fileName);
        
        if (success) {
            // 현재 프로젝트 데이터 다시 로드하여 UI 갱신
            if (window.loadProject) {
                await window.loadProject(currentProject.name);
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('메모 생성 중 오류:', error);
        return false;
    }
}

// 전역에서 접근 가능하도록 함수 노출
window.updateTabs = updateTabs;
window.createTab = createTab;
