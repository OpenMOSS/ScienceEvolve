export class GitHubRepositoryManagementError extends Error {
  constructor(readonly status: number, message: string, readonly code = "github_repository_management_failed") {
    super(message);
    this.name = "GitHubRepositoryManagementError";
  }
}

export interface GitHubRepositoryDeletionIdentity {
  providerId: number;
  owner: string;
  name: string;
}
