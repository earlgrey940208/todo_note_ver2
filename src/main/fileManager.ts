import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { Project, ProjectFile, ProjectData } from '../shared/types';

export class FileManager {
  private dataPath: string;
  private configPath: string;

  constructor() {
    // 설정 파일 경로
    this.configPath = path.join(app.getPath('userData'), 'config.json');
    // 데이터 경로 로드
    this.dataPath = this.loadDataPath();
    // 데이터 폴더 생성
    this.ensureDataDirectory();
  }

  // 설정에서 데이터 경로 로드
  private loadDataPath(): string {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        if (config.dataPath && fs.existsSync(config.dataPath)) {
          return config.dataPath;
        }
      }
    } catch (error) {
      console.error('설정 파일 로드 실패:', error);
    }
    // 기본값: Documents/Data
    return path.join(app.getPath('documents'), 'Data');
  }

  // 데이터 디렉토리 생성
  private ensureDataDirectory(): void {
    try {
      if (!fs.existsSync(this.dataPath)) {
        fs.mkdirSync(this.dataPath, { recursive: true });
      }
    } catch (error) {
      console.error('데이터 디렉토리 생성 실패:', error);
    }
  }

  // 현재 데이터 경로 반환
  getDataPath(): string {
    return this.dataPath;
  }

  // 데이터 경로 변경
  setDataPath(newPath: string): boolean {
    try {
      if (!path.isAbsolute(newPath)) {
        throw new Error('절대 경로여야 합니다');
      }

      if (!fs.existsSync(newPath)) {
        fs.mkdirSync(newPath, { recursive: true });
      }

      // 설정 저장
      const config = { dataPath: newPath };
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      
      // 내부 경로 업데이트
      this.dataPath = newPath;
      
      return true;
    } catch (error) {
      console.error('데이터 경로 변경 실패:', error);
      return false;
    }
  }

  // 프로젝트 목록 가져오기
  getProjects(): Project[] {
    try {
      if (!fs.existsSync(this.dataPath)) {
        return [];
      }

      const projectNames = fs.readdirSync(this.dataPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      return projectNames.map(name => ({
        name,
        path: path.join(this.dataPath, name)
      }));
    } catch (error) {
      console.error('프로젝트 목록 읽기 실패:', error);
      return [];
    }
  }

  // 특정 프로젝트의 파일들 가져오기
  getProjectFiles(projectName: string): ProjectFile[] {
    try {
      const projectPath = path.join(this.dataPath, projectName);
      
      if (!fs.existsSync(projectPath)) {
        return [];
      }

      const fileNames = fs.readdirSync(projectPath)
        .filter(fileName => fileName.endsWith('.txt'));

      const files: ProjectFile[] = [];

      for (const fileName of fileNames) {
        const filePath = path.join(projectPath, fileName);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        let type: 'pinnote' | 'todo' | 'memo';
        if (fileName === 'pinnote.txt') {
          type = 'pinnote';
        } else if (fileName === 'todo.txt') {
          type = 'todo';
        } else {
          type = 'memo';
        }

        files.push({
          name: fileName,
          content,
          type
        });
      }

      return files;
    } catch (error) {
      console.error('프로젝트 파일 읽기 실패:', error);
      return [];
    }
  }

  // 프로젝트 전체 데이터 가져오기
  getProjectData(projectName: string): ProjectData | null {
    try {
      const projects = this.getProjects();
      const project = projects.find(p => p.name === projectName);
      
      if (!project) {
        return null;
      }

      const files = this.getProjectFiles(projectName);
      
      return {
        project,
        files
      };
    } catch (error) {
      console.error('프로젝트 데이터 읽기 실패:', error);
      return null;
    }
  }

  // 프로젝트 폴더 이름 변경
  renameProject(oldName: string, newName: string): boolean {
    try {
      const oldPath = path.join(this.dataPath, oldName);
      const newPath = path.join(this.dataPath, newName);
      
      if (!fs.existsSync(oldPath)) {
        return false;
      }
      
      if (fs.existsSync(newPath)) {
        return false; // 이미 같은 이름의 프로젝트가 존재
      }
      
      fs.renameSync(oldPath, newPath);
      return true;
    } catch (error) {
      console.error('프로젝트 이름 변경 실패:', error);
      return false;
    }
  }

  // 메모 파일 이름 변경
  renameFile(projectName: any, oldFileName: string, newFileName: string): boolean {
    try {
      const name = projectName.name || projectName;
      
      // todo.txt는 이름 변경 불가
      if (oldFileName === 'todo.txt') {
        return false;
      }
      
      const projectPath = path.join(this.dataPath, name);
      const oldFilePath = path.join(projectPath, oldFileName);
      const newFilePath = path.join(projectPath, newFileName);
      
      if (!fs.existsSync(oldFilePath)) {
        return false;
      }
      
      if (fs.existsSync(newFilePath)) {
        return false; // 이미 같은 이름의 파일이 존재
      }
      
      fs.renameSync(oldFilePath, newFilePath);
      return true;
    } catch (error) {
      console.error('파일 이름 변경 실패:', error);
      return false;
    }
  }

  // 새 프로젝트 생성
  createProject(projectName: string): boolean {
    try {
      const projectPath = path.join(this.dataPath, projectName);
      
      // 이미 같은 이름의 프로젝트가 존재하는지 확인
      if (fs.existsSync(projectPath)) {
        return false;
      }

      // 데이터 폴더가 없으면 생성
      if (!fs.existsSync(this.dataPath)) {
        fs.mkdirSync(this.dataPath, { recursive: true });
      }

      // 프로젝트 폴더 생성
      fs.mkdirSync(projectPath);

      // 기본 파일들 생성
      const pinnotePath = path.join(projectPath, 'pinnote.txt');
      const todoPath = path.join(projectPath, 'todo.txt');

      fs.writeFileSync(pinnotePath, ''); // 빈 pinnote 파일
      fs.writeFileSync(todoPath, ''); // 빈 todo 파일

      return true;
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
      return false;
    }
  }

  // 파일 저장
  saveFile(projectName: string, fileName: string, content: string): boolean {
    try {
      const projectPath = path.join(this.dataPath, projectName);
      const filePath = path.join(projectPath, fileName);
      
      if (!fs.existsSync(projectPath)) {
        return false;
      }
      
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('파일 저장 실패:', error);
      return false;
    }
  }

  // 새 메모 파일 생성
  createMemoFile(projectName: any, fileName: string): boolean {
    try {
      const name = projectName.name || projectName;
      const projectPath = path.join(this.dataPath, name);
      const filePath = path.join(projectPath, fileName);
      
      if (!fs.existsSync(projectPath)) {
        return false;
      }
      
      if (fs.existsSync(filePath)) {
        return false; // 이미 같은 이름의 파일이 존재
      }
      
      fs.writeFileSync(filePath, '', 'utf-8'); // 빈 메모 파일 생성
      return true;
    } catch (error) {
      console.error('메모 파일 생성 실패:', error);
      return false;
    }
  }
}
