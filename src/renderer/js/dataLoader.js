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
            if (window.renderProjects) {
                window.renderProjects(projects);
            }
            // 첫 번째 프로젝트 로딩
            await loadProject(projects[0].name);
        }
    } catch (error) {
        console.error('프로젝트 로딩 실패:', error);
    }
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
            if (window.updateTabs) {
                window.updateTabs();
            }
        }
    } catch (error) {
        console.error('프로젝트 데이터 로딩 실패:', error);
    }
}

// 새 프로젝트 생성
async function createProject(projectName) {
    try {
        const success = await ipcRenderer.invoke('create-project', projectName);
        
        if (success) {
            // 프로젝트 목록 새로고침
            await loadProjects();
            // 새로 생성된 프로젝트 로딩
            await loadProject(projectName);
            return true;
        } else {
            console.error('프로젝트 생성 실패: 이미 존재하는 이름이거나 오류 발생');
            return false;
        }
    } catch (error) {
        console.error('프로젝트 생성 실패:', error);
        return false;
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

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.setupWindowControls();
    initApp();
});

// 전역에서 접근 가능하도록 함수들 노출
window.ipcRenderer = ipcRenderer;
window.loadProject = loadProject;
window.createProject = createProject;
// currentFiles를 실시간으로 접근할 수 있도록 getter 함수로 노출
window.getCurrentFiles = () => currentFiles;
window.getCurrentProject = () => currentProject;
