// Todo 관리 모듈

// Todo 콘텐츠 생성 (체크리스트 형태)
function createTodoContent(content) {
    let todoHTML = '<div class="todo-list">';
    
    if (content && content.trim() !== '') {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
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
    }
    
    // 추가 버튼 (내용이 있든 없든 항상 표시)
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
    const todoTexts = tabPane.querySelectorAll('.todo-text');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const todoItem = this.closest('.todo-item');
            
            if (this.checked) {
                todoItem.classList.add('checked');
            } else {
                todoItem.classList.remove('checked');
            }
            
            // Todo 체크박스 변경 시 자동저장
            if (window.saveFile && window.getTodoContent) {
                const todoContent = window.getTodoContent();
                window.saveFile('todo.txt', todoContent);
            }
        });
    });

    // Todo 텍스트 더블클릭 편집
    todoTexts.forEach(todoText => {
        todoText.addEventListener('dblclick', function() {
            startEditTodoText(this);
        });
    });

    // Todo 로드 시 스크롤을 하단으로 이동
    const todoList = tabPane.querySelector('.todo-list');
    if (todoList) {
        setTimeout(() => {
            todoList.scrollTop = todoList.scrollHeight;
        }, 0);
    }
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
    const todoText = newItem.querySelector('.todo-text');
    
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            newItem.classList.add('checked');
        } else {
            newItem.classList.remove('checked');
        }
        
        // Todo 체크박스 변경 시 자동저장
        if (window.saveFile && window.getTodoContent) {
            const todoContent = window.getTodoContent();
            window.saveFile('todo.txt', todoContent);
        }
    });

    // 새 텍스트에 더블클릭 이벤트 추가
    todoText.addEventListener('dblclick', function() {
        startEditTodoText(this);
    });
    
    // 입력 모드 종료
    cancelAddMode(addBtn, inputContainer, input);
    
    // 새 항목 추가 시 자동저장
    if (window.saveFile && window.getTodoContent) {
        const todoContent = window.getTodoContent();
        window.saveFile('todo.txt', todoContent);
    }
}

// 추가 모드 취소
function cancelAddMode(addBtn, inputContainer, input) {
    addBtn.style.display = 'block';
    inputContainer.style.display = 'none';
    input.value = '';
}

// Todo 텍스트 편집 시작
function startEditTodoText(todoText) {
    const originalText = todoText.textContent;
    const input = document.createElement('input');
    let editCompleted = false; // 편집 완료 플래그
    
    input.type = 'text';
    input.value = originalText;
    input.className = 'edit-input';
    input.style.fontSize = '14px';
    input.style.padding = '2px 4px';
    
    // 텍스트를 input으로 교체
    todoText.style.display = 'none';
    todoText.parentNode.insertBefore(input, todoText.nextSibling);
    input.focus();
    input.select();
    
    // Enter 키로 편집 완료
    input.addEventListener('keydown', (e) => {
        if (editCompleted) return; // 이미 완료된 경우 무시
        
        if (e.key === 'Enter') {
            editCompleted = true;
            finishEditTodoText(todoText, input, originalText);
        } else if (e.key === 'Escape') {
            editCompleted = true;
            cancelEditTodoText(todoText, input, originalText);
        }
    });
    
    // 포커스 잃으면 편집 완료
    input.addEventListener('blur', () => {
        if (editCompleted) return; // 이미 완료된 경우 무시
        
        setTimeout(() => {
            if (!editCompleted) { // 다시 한번 확인
                editCompleted = true;
                finishEditTodoText(todoText, input, originalText);
            }
        }, 100);
    });
}

// Todo 텍스트 편집 완료
function finishEditTodoText(todoText, input, originalText) {
    const newText = input.value.trim();
    
    if (newText && newText !== originalText) {
        todoText.textContent = newText;
        
        // 자동저장
        if (window.saveFile && window.getTodoContent) {
            const todoContent = window.getTodoContent();
            window.saveFile('todo.txt', todoContent);
        }
    }
    
    // 원래 상태로 복원
    todoText.style.display = '';
    input.remove();
}

// Todo 텍스트 편집 취소
function cancelEditTodoText(todoText, input, originalText) {
    // 원래 텍스트로 복원
    todoText.textContent = originalText;
    todoText.style.display = '';
    input.remove();
}

// 전역에서 접근 가능하도록 함수 노출
window.createTodoContent = createTodoContent;
window.setupTodoCheckboxListeners = setupTodoCheckboxListeners;
window.setupTodoAddButtonListener = setupTodoAddButtonListener;
