/**
 * Project Manager
 * Manages multi-repository projects and cross-repo operations
 *
 * Phase 2: Multi-Repository Support
 */

import { nanoid } from "nanoid";
import type { SQLiteManager } from "../storage/sqlite-manager.js";
import type {
  AddRepositoryInput,
  CreateProjectInput,
  CrossRepoSearchOptions,
  Project,
  ProjectFilterOptions,
  ProjectRepository,
  ProjectStats,
  UpdateProjectInput,
} from "../types/project.js";
import { logger } from "../utils/logger.js";

export class ProjectManager {
  constructor(private sqliteManager: SQLiteManager) {}

  /**
   * Create a new project
   */
  createProject(input: CreateProjectInput): Project {
    const db = this.sqliteManager.getConnection();
    const now = Date.now();

    const project: Project = {
      id: nanoid(),
      name: input.name,
      description: input.description,
      created_at: now,
      updated_at: now,
      metadata: input.metadata,
    };

    const stmt = db.prepare(`
      INSERT INTO projects (id, name, description, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      project.id,
      project.name,
      project.description || null,
      project.created_at,
      project.updated_at,
      project.metadata ? JSON.stringify(project.metadata) : null,
    );

    logger.info("PROJECT_CREATED", `Project created: ${project.name}`, { project_id: project.id });

    return project;
  }

  /**
   * Get project by ID
   */
  getProject(projectId: string): Project | null {
    const db = this.sqliteManager.getConnection();

    const row = db
      .prepare(`
      SELECT id, name, description, created_at, updated_at, metadata
      FROM projects
      WHERE id = ?
    `)
      .get(projectId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  /**
   * List all projects
   */
  listProjects(options: ProjectFilterOptions = {}): Project[] {
    const db = this.sqliteManager.getConnection();
    const { limit = 100, offset = 0, name, tag } = options;

    let query = `
      SELECT id, name, description, created_at, updated_at, metadata
      FROM projects
      WHERE 1=1
    `;
    const params: any[] = [];

    if (name) {
      query += ` AND name LIKE ?`;
      params.push(`%${name}%`);
    }

    if (tag && tag.length > 0) {
      // Filter by tag in metadata JSON
      query += ` AND json_extract(metadata, '$.tags') LIKE ?`;
      params.push(`%${tag}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Update project
   */
  updateProject(projectId: string, input: UpdateProjectInput): Project | null {
    const db = this.sqliteManager.getConnection();
    const existing = this.getProject(projectId);

    if (!existing) {
      return null;
    }

    const now = Date.now();
    const updated: Project = {
      ...existing,
      name: input.name !== undefined ? input.name : existing.name,
      description: input.description !== undefined ? input.description : existing.description,
      metadata: input.metadata !== undefined ? input.metadata : existing.metadata,
      updated_at: now,
    };

    const stmt = db.prepare(`
      UPDATE projects
      SET name = ?, description = ?, metadata = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.name,
      updated.description || null,
      updated.metadata ? JSON.stringify(updated.metadata) : null,
      updated.updated_at,
      projectId,
    );

    logger.info("PROJECT_UPDATED", `Project updated: ${updated.name}`, { project_id: projectId });

    return updated;
  }

  /**
   * Delete project and all its data
   */
  deleteProject(projectId: string): boolean {
    const db = this.sqliteManager.getConnection();

    // Delete project (cascade will handle repositories, entities, etc.)
    const result = db.prepare(`DELETE FROM projects WHERE id = ?`).run(projectId);

    if (result.changes > 0) {
      logger.info("PROJECT_DELETED", `Project deleted`, { project_id: projectId });
      return true;
    }

    return false;
  }

  /**
   * Add repository to project
   */
  addRepository(projectId: string, input: AddRepositoryInput): ProjectRepository {
    const db = this.sqliteManager.getConnection();

    // Verify project exists
    if (!this.getProject(projectId)) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const repository: ProjectRepository = {
      id: nanoid(),
      project_id: projectId,
      repository_path: input.repository_path,
      repository_name: input.repository_name || this.getRepositoryNameFromPath(input.repository_path),
      added_at: Date.now(),
      last_indexed: undefined,
      metadata: input.metadata,
    };

    const stmt = db.prepare(`
      INSERT INTO project_repositories (id, project_id, repository_path, repository_name, added_at, last_indexed, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      repository.id,
      repository.project_id,
      repository.repository_path,
      repository.repository_name,
      repository.added_at,
      repository.last_indexed || null,
      repository.metadata ? JSON.stringify(repository.metadata) : null,
    );

    logger.info("REPOSITORY_ADDED", `Repository added to project`, {
      project_id: projectId,
      repository_id: repository.id,
      repository_path: repository.repository_path,
    });

    return repository;
  }

  /**
   * List repositories in a project
   */
  listRepositories(projectId: string): ProjectRepository[] {
    const db = this.sqliteManager.getConnection();

    const rows = db
      .prepare(`
      SELECT id, project_id, repository_path, repository_name, added_at, last_indexed, metadata
      FROM project_repositories
      WHERE project_id = ?
      ORDER BY added_at ASC
    `)
      .all(projectId) as any[];

    return rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      repository_path: row.repository_path,
      repository_name: row.repository_name,
      added_at: row.added_at,
      last_indexed: row.last_indexed,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Remove repository from project
   */
  removeRepository(repositoryId: string): boolean {
    const db = this.sqliteManager.getConnection();

    // Get repository info before deletion for cleanup
    const repo = db
      .prepare(`SELECT project_id, repository_path FROM project_repositories WHERE id = ?`)
      .get(repositoryId) as any;

    if (!repo) {
      return false;
    }

    // Delete repository entry
    const result = db.prepare(`DELETE FROM project_repositories WHERE id = ?`).run(repositoryId);

    if (result.changes > 0) {
      // Clean up entities/files associated with this repository path
      // Note: We use repository_path in file_path to identify entities from this repo
      db.prepare(`DELETE FROM entities WHERE project_id = ? AND file_path LIKE ?`).run(
        repo.project_id,
        `${repo.repository_path}%`,
      );

      db.prepare(`DELETE FROM files WHERE project_id = ? AND path LIKE ?`).run(
        repo.project_id,
        `${repo.repository_path}%`,
      );

      logger.info("REPOSITORY_REMOVED", `Repository removed from project`, {
        project_id: repo.project_id,
        repository_id: repositoryId,
      });

      return true;
    }

    return false;
  }

  /**
   * Get project statistics
   */
  getProjectStats(projectId: string): ProjectStats | null {
    const db = this.sqliteManager.getConnection();

    const row = db
      .prepare(`
      SELECT * FROM project_stats WHERE project_id = ?
    `)
      .get(projectId) as any;

    if (!row) {
      return null;
    }

    return {
      project_id: row.project_id,
      project_name: row.project_name,
      repository_count: row.repository_count,
      entity_count: row.entity_count,
      file_count: row.file_count,
      embedding_count: row.embedding_count,
      last_indexed: row.last_indexed,
    };
  }

  /**
   * Update repository last indexed time
   */
  updateRepositoryIndexTime(repositoryId: string, timestamp: number = Date.now()): void {
    const db = this.sqliteManager.getConnection();

    db.prepare(`UPDATE project_repositories SET last_indexed = ? WHERE id = ?`).run(timestamp, repositoryId);
  }

  /**
   * Search across all repositories in a project
   *
   * This will be enhanced with re-ranking in Phase 4
   */
  async searchAcrossRepos(options: CrossRepoSearchOptions): Promise<any[]> {
    const db = this.sqliteManager.getConnection();

    // Get all repositories in the project
    const repositories = this.listRepositories(options.project_id);

    if (repositories.length === 0) {
      return [];
    }

    logger.info("CROSS_REPO_SEARCH", `Searching across ${repositories.length} repositories`, {
      project_id: options.project_id,
      query: options.query,
    });

    // For now, we'll do a basic full-text search across entities
    // This will be enhanced with semantic search and re-ranking in later phases

    let query = `
      SELECT e.*, f.path as file_path
      FROM entities e
      LEFT JOIN files f ON e.file_path = f.path
      WHERE e.project_id = ?
      AND (
        e.name LIKE ? OR
        e.metadata LIKE ?
      )
    `;

    const params: any[] = [options.project_id, `%${options.query}%`, `%${options.query}%`];

    // Filter by specific repositories if provided
    if (options.repositories && options.repositories.length > 0) {
      const repoConditions = options.repositories.map(() => `e.file_path LIKE ?`).join(" OR ");
      query += ` AND (${repoConditions})`;
      params.push(...options.repositories.map((repo) => `${repo}%`));
    }

    // Filter by file types if provided
    if (options.file_types && options.file_types.length > 0) {
      const typeConditions = options.file_types.map(() => `e.file_path LIKE ?`).join(" OR ");
      query += ` AND (${typeConditions})`;
      params.push(...options.file_types.map((type) => `%.${type}`));
    }

    query += ` ORDER BY e.updated_at DESC LIMIT ?`;
    params.push(options.limit || 10);

    const results = db.prepare(query).all(...params) as any[];

    return results.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      file_path: row.file_path,
      location: row.location ? JSON.parse(row.location) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      project_id: row.project_id,
    }));
  }

  /**
   * Extract repository name from path
   */
  private getRepositoryNameFromPath(path: string): string {
    const parts = path.split("/");
    return parts[parts.length - 1] || "unnamed-repo";
  }

  /**
   * Check if project exists
   */
  projectExists(projectId: string): boolean {
    return this.getProject(projectId) !== null;
  }

  /**
   * Get repository by path
   */
  getRepositoryByPath(projectId: string, repositoryPath: string): ProjectRepository | null {
    const db = this.sqliteManager.getConnection();

    const row = db
      .prepare(`
      SELECT id, project_id, repository_path, repository_name, added_at, last_indexed, metadata
      FROM project_repositories
      WHERE project_id = ? AND repository_path = ?
    `)
      .get(projectId, repositoryPath) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      project_id: row.project_id,
      repository_path: row.repository_path,
      repository_name: row.repository_name,
      added_at: row.added_at,
      last_indexed: row.last_indexed,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
