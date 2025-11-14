/**
 * Project Management Types
 * Types and interfaces for multi-repository project support
 *
 * Phase 2: Multi-Repository Support
 */

/**
 * Project represents a collection of repositories
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: number;
  updated_at: number;
  metadata?: ProjectMetadata;
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  owner?: string;
  tags?: string[];
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Repository within a project
 */
export interface ProjectRepository {
  id: string;
  project_id: string;
  repository_path: string;
  repository_name: string;
  added_at: number;
  last_indexed?: number;
  metadata?: RepositoryMetadata;
}

/**
 * Repository metadata
 */
export interface RepositoryMetadata {
  branch?: string;
  commit?: string;
  stats?: {
    file_count?: number;
    entity_count?: number;
    last_commit_date?: string;
  };
  [key: string]: unknown;
}

/**
 * Project statistics
 */
export interface ProjectStats {
  project_id: string;
  project_name: string;
  repository_count: number;
  entity_count: number;
  file_count: number;
  embedding_count: number;
  last_indexed?: number;
}

/**
 * Create project input
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  metadata?: ProjectMetadata;
}

/**
 * Update project input
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  metadata?: ProjectMetadata;
}

/**
 * Add repository to project input
 */
export interface AddRepositoryInput {
  repository_path: string;
  repository_name?: string;
  metadata?: RepositoryMetadata;
}

/**
 * Project filter options
 */
export interface ProjectFilterOptions {
  project_id?: string;
  name?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

/**
 * Cross-repository search options
 */
export interface CrossRepoSearchOptions {
  project_id: string;
  query: string;
  limit?: number;
  repositories?: string[]; // Filter to specific repos
  file_types?: string[];
  min_score?: number;
}
