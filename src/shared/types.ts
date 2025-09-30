export interface Project {
  name: string;
  path: string;
}

export interface ProjectFile {
  name: string;
  content: string;
  type: 'pinnote' | 'todo' | 'memo';
}

export interface ProjectData {
  project: Project;
  files: ProjectFile[];
}
