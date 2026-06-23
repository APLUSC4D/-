export interface LibraryItem {
  id: string;
  name: string;
  ext: string;
  url: string;
  annotation: string;
  tags: string[];
  folders: string[]; // List of folder IDs this item is in
  isDeleted: boolean;
  rating: number; // 0 to 5
  palette: string[]; // Hex color array
  width: number;
  height: number;
  size: number; // bytes
  createdAt: string;
  addedAt: string;
  modifiedAt: string;
  type: 'image' | 'video';
  path: string; // File URL path (e.g. /library/files/xxxxx.png)
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // For hierarchical folders
  color?: string; // Optional folder icon highlight color
}

export interface LibraryState {
  items: LibraryItem[];
  folders: Folder[];
}
