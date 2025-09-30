// Todo 관리 모듈

// Todo 콘텐츠 생성 (체크리스트 형태)
function createTodoContent(content) {
    if (!content || content.trim() === '') {
        return '<div class="todo-list"></div>';
    }
    
    const lines = content.split('\n').filter(line => line.trim() !== '');
    let todoHTML = '<div class="todo-list">';
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed === '') return;
        
        let isChecked = false;
        let text = '';
        
        if (trimmed.startsWith('V ')) {
            isChecked = true;
            text = trimmed.substring(2);
        } else if (trimmed.startsWith('- ')) {
            isChecked = false;
            text = trimmed.substring(2);
        } else {
            // 형식이 맞지 않는 경우 그대로 표시
            text = trimmed;
        }
        
        todoHTML += `
            <div class="todo-item ${isChecked ? 'checked' : ''}" data-index="${index}">
                <input type="checkbox" class="todo-checkbox" ${isChecked ? 'checked' : ''}>
                <span class="todo-text">${text}</span>
            </div>
        `;
    });
    
    // 추가 버튼
    todoHTML += `
        <div class="todo-add-section">
            <button class="todo-add-btn">+ 추가</button>
            <div class="todo-add-input-container" style="display: none;">
                <input type="text" class="todo-add-input" placeholder="새로운 할일을 입력하세요">
            </div>
        </div>
    `;
    
    todoHTML += '</div>';
    return todoHTML;
}

// Todo 체크박스 이벤트 리스너 설정
function setupTodoCheckboxListeners(tabPane) {
    const checkboxes = tabPane.querySelectorAll('.todo-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const todoItem = this.closest('.todo-item');
            
            if (this.checked) {
                todoItem.classList.add('checked');
            } else {
                todoItem.classList.remove('checked');
            }
        });
    });
}

// Todo 추가 버튼 이벤트 리스너 설정
function setupTodoAddButtonListener(tabPane) {
    const addBtn = tabPane.querySelector('.todo-add-btn');
    const inputContainer = tabPane.querySelector('.todo-add-input-container');
    const input = tabPane.querySelector('.todo-add-input');
    const todoList = tabPane.querySelector('.todo-list');
    
    // 추가 버튼 클릭
    addBtn.addEventListener('click', () => {
        addBtn.style.display = 'none';
        inputContainer.style.display = 'block';
        input.focus();
    });
    
    // Enter 키로 항목 추가
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const text = input.value.trim();
            if (text) {
                addNewTodoItem(todoList, text, addBtn, inputContainer, input);
            } else {
                cancelAddMode(addBtn, inputContainer, input);
            }
        } else if (e.key === 'Escape') {
            cancelAddMode(addBtn, inputContainer, input);
        }
    });
    
    // 포커스 잃을 때 취소
    input.addEventListener('blur', () => {
        setTimeout(() => {
            cancelAddMode(addBtn, inputContainer, input);
        }, 100);
    });
}

// 새 Todo 항목 추가
function addNewTodoItem(todoList, text, addBtn, inputContainer, input) {
    const addSection = todoList.querySelector('.todo-add-section');
    const newItem = document.createElement('div');
    newItem.className = 'todo-item';
    newItem.innerHTML = `
        <input type="checkbox" class="todo-checkbox">
        <span class="todo-text">${text}</span>
    `;
    
    // 추가 섹션 앞에 새 항목 삽입
    todoList.insertBefore(newItem, addSection);
    
    // 새 체크박스에 이벤트 리스너 추가
    const checkbox = newItem.querySelector('.todo-checkbox');
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            newItem.classList.add('checked');
        } else {
            newItem.classList.remove('checked');
        }
    });
    
    // 입력 모드 종료
    cancelAddMode(addBtn, inputContainer, input);
}

// 추가 모드 취소
function cancelAddMode(addBtn, inputContainer, input) {
    addBtn.style.display = 'block';
    inputContainer.style.display = 'none';
    input.value = '';
}

// 전역에서 접근 가능하도록 함수 노출
window.createTodoContent = createTodoContent;
window.setupTodoCheckboxListeners = setupTodoCheckboxListeners;
window.setupTodoAddButtonListener = setupTodoAddButtonListener;
