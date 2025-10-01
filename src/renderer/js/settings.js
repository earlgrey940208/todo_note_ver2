// 설정 관리
class SettingsManager {
    constructor() {
        this.initializeSettings();
    }

    async initializeSettings() {
        // 설정 버튼 이벤트
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        // 모달 닫기 이벤트
        document.getElementById('settings-cancel').addEventListener('click', () => {
            this.hideSettings();
        });

        // 모달 배경 클릭으로 닫기
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideSettings();
            }
        });

        // 폴더 변경 버튼
        document.getElementById('change-path-btn').addEventListener('click', () => {
            this.selectFolder();
        });

        // 저장 버튼
        document.getElementById('settings-save').addEventListener('click', () => {
            this.saveSettings();
        });

        // 초기 데이터 경로 로드
        await this.loadCurrentPath();
    }

    async showSettings() {
        await this.loadCurrentPath();
        document.getElementById('settings-modal').style.display = 'flex';
    }

    hideSettings() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    async loadCurrentPath() {
        try {
            const currentPath = await window.electronAPI.invoke('get-data-path');
            document.getElementById('data-path-input').value = currentPath;
        } catch (error) {
            console.error('현재 경로 로드 실패:', error);
        }
    }

    async selectFolder() {
        try {
            const selectedPath = await window.electronAPI.invoke('select-folder');
            if (selectedPath) {
                document.getElementById('data-path-input').value = selectedPath;
            }
        } catch (error) {
            console.error('폴더 선택 실패:', error);
            alert('폴더 선택에 실패했습니다.');
        }
    }

    async saveSettings() {
        try {
            const newPath = document.getElementById('data-path-input').value;

            if (!newPath) {
                alert('경로를 선택해주세요.');
                return;
            }

            // 로딩 표시
            const saveBtn = document.getElementById('settings-save');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '저장 중...';
            saveBtn.disabled = true;

            const result = await window.electronAPI.invoke('change-data-path', newPath);

            if (result) {
                alert('설정이 저장되었습니다.');
                this.hideSettings();
                
                // 프로젝트 목록 새로고침
                if (window.loadProjects) {
                    await window.loadProjects();
                }
            } else {
                alert('설정 저장에 실패했습니다.');
            }

            // 로딩 해제
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;

        } catch (error) {
            console.error('설정 저장 실패:', error);
            alert('설정 저장에 실패했습니다.');
        }
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
