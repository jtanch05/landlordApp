export class PermissionCheckError extends Error {
  constructor(checkName: string, message: string) {
    super(`Permission check "${checkName}" failed: ${message}`);
    this.name = "PermissionCheckError";
  }
}
