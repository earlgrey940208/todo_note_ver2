import * as fs from 'fs';
import * as path from 'path';
import { Project, ProjectFile, ProjectData } from '../shared/types';

export class FileManager {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(__dirname, '../../Data');
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
}
