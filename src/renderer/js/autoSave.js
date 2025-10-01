// 자동저장 관리 모듈

let saveTimeouts = new Map(); // 파일별 저장 타이머

// 범용 자동저장 설정
function setupAutoSave(element, fileName, contentGetter = null) {
    element.addEventListener('input', (e) => {
        // 기존 타이머 취소
        if (saveTimeouts.has(fileName)) {
            clearTimeout(saveTimeouts.get(fileName));
        }
        
        // 1초 후 자동저장
        const timeout = setTimeout(async () => {
            const content = contentGetter ? contentGetter() : e.target.value;
            await saveFile(fileName, content);
            saveTimeouts.delete(fileName);
        }, 1000);
        
        saveTimeouts.set(fileName, timeout);
    });
}

// 파일 저장 실행
async function saveFile(fileName, content) {
    try {
        const currentProject = window.getCurrentProject();
        if (!currentProject || !currentProject.name) {
            console.warn('현재 프로젝트가 없습니다.');
            return false;
        }

        const success = await window.ipcRenderer.invoke('save-file', currentProject.name, fileName, content);
        
        if (success) {
            console.log(`${fileName} 자동저장 완료`);
        } else {
            console.error(`${fileName} 자동저장 실패`);
        }
        
        return success;
    } catch (error) {
        console.error('파일 저장 중 오류:', error);
        return false;
    }
}

// Todo 체크박스 상태를 텍스트로 변환
function getTodoContent() {
    const todoPane = document.querySelector('.tab-pane[data-type="todo"]') || 
                     document.querySelector('#todo');
    if (!todoPane) return '';
    
    const items = todoPane.querySelectorAll('.todo-item');
    const lines = [];
    
    items.forEach(item => {
        const checkbox = item.querySelector('.todo-checkbox');
        const textElement = item.querySelector('.todo-text');
        if (!checkbox || !textElement) return;
        
        const text = textElement.textContent;
        const isChecked = checkbox.checked;
        
        lines.push(isChecked ? `V ${text}` : `- ${text}`);
    });
    
    return lines.join('\n');
}

// 전역에서 접근 가능하도록 함수들 노출
window.setupAutoSave = setupAutoSave;
window.saveFile = saveFile;
window.getTodoContent = getTodoContent;
