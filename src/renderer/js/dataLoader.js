const { ipcRenderer } = require('electron');

let currentProject = null;
let currentFiles = [];

// 앱 초기화
async function initApp() {
    await loadProjects();
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
        projectItem.className = `project-item ${index === 0 ? 'active' : ''}`;
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
    tab.className = `tab ${isActive ? 'active' : ''}`;
    tab.setAttribute('data-tab', tabId);
    tab.innerHTML = `
        <span class="tab-icon">${icon}</span>
        <span class="tab-label">${label}</span>
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
