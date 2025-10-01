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

// 전역에서 접근 가능하도록 함수 노출
window.updateTabs = updateTabs;
window.createTab = createTab;
