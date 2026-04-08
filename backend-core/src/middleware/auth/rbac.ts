/**
 * Compatibility layer for requested modular structure:
 * src/middleware/auth/
 *
 * Re-exports auth guards from the active middleware implementation.
 */
export { authMiddleware, requireRoles, type AppRole } from "../../middlewares/auth.js";
export { adminAuthMiddleware, requireAdminRole } from "../../middlewares/adminAuth.js";

