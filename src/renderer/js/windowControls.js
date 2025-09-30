// 윈도우 컨트롤 모듈

// 윈도우 컨트롤 버튼 기능
function setupWindowControls() {
    document.querySelector('.minimize').addEventListener('click', () => {
        window.ipcRenderer.send('window-minimize');
    });

    document.querySelector('.maximize').addEventListener('click', () => {
        window.ipcRenderer.send('window-maximize');
    });

    document.querySelector('.close').addEventListener('click', () => {
        window.ipcRenderer.send('window-close');
    });
}

// 전역에서 접근 가능하도록 함수 노출
window.setupWindowControls = setupWindowControls;
