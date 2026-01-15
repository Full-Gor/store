import { query, createAppDir, getAppFilePath } from '../config/database.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler.js';
import fs from 'fs/promises';
import path from 'path';

// POST /api/upload/app/:appId
export async function uploadAppFile(req, res, next) {
  try {
    const { appId } = req.params;
    const file = req.file;

    if (!file) {
      throw new ValidationError('Aucun fichier fourni');
    }

    // Verify app ownership
    const appResult = await query(
      'SELECT * FROM apps WHERE id = $1 AND developer_id = $2',
      [appId, req.user.id]
    );

    if (appResult.rows.length === 0) {
      // Clean up temp file
      await fs.unlink(file.path).catch(() => {});
      throw new NotFoundError('Application non trouvée ou accès non autorisé');
    }

    const app = appResult.rows[0];

    // Create app directory
    await createAppDir(appId);

    // Determine file type and extract metadata
    let metadata = {};
    const ext = path.extname(file.originalname).toLowerCase();

    // For APK files, we could parse metadata here
    // For now, just use basic file info
    if (ext === '.apk') {
      metadata.type = 'apk';
    } else if (ext === '.aab') {
      metadata.type = 'aab';
    } else if (ext === '.zip') {
      metadata.type = 'pwa';
    }

    // Move file to app directory
    const newFileName = `app${ext}`;
    const newPath = getAppFilePath(appId, newFileName);
    await fs.rename(file.path, newPath);

    // Get file size
    const fileStats = await fs.stat(newPath);

    // Update database
    await query(`
      UPDATE apps SET
        file_path = $1,
        size = $2,
        type = COALESCE($3, type),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [newPath, fileStats.size, metadata.type, appId]);

    res.json({
      message: 'Fichier uploadé avec succès',
      file: {
        name: newFileName,
        size: fileStats.size,
        path: newPath
      },
      metadata
    });
  } catch (error) {
    // Clean up temp file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
}

// POST /api/upload/icon/:appId
export async function uploadAppIcon(req, res, next) {
  try {
    const { appId } = req.params;
    const file = req.file;

    if (!file) {
      throw new ValidationError('Aucun fichier fourni');
    }

    // Verify app ownership
    const appResult = await query(
      'SELECT * FROM apps WHERE id = $1 AND developer_id = $2',
      [appId, req.user.id]
    );

    if (appResult.rows.length === 0) {
      await fs.unlink(file.path).catch(() => {});
      throw new NotFoundError('Application non trouvée ou accès non autorisé');
    }

    // Create app directory if needed
    await createAppDir(appId);

    // Move file to app directory
    const ext = path.extname(file.originalname).toLowerCase();
    const newFileName = `icon${ext}`;
    const newPath = getAppFilePath(appId, newFileName);
    await fs.rename(file.path, newPath);

    // Update database
    await query('UPDATE apps SET icon = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPath, appId]);

    res.json({
      message: 'Icône uploadée avec succès',
      icon: {
        path: newPath,
        url: `/uploads/apps/${appId}/${newFileName}`
      }
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
}

// POST /api/upload/screenshots/:appId
export async function uploadScreenshots(req, res, next) {
  try {
    const { appId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      throw new ValidationError('Aucun fichier fourni');
    }

    // Verify app ownership
    const appResult = await query(
      'SELECT * FROM apps WHERE id = $1 AND developer_id = $2',
      [appId, req.user.id]
    );

    if (appResult.rows.length === 0) {
      // Clean up temp files
      for (const file of files) {
        await fs.unlink(file.path).catch(() => {});
      }
      throw new NotFoundError('Application non trouvée ou accès non autorisé');
    }

    // Create screenshots directory
    await createAppDir(appId);
    const screenshotsDir = getAppFilePath(appId, 'screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    // Move files
    const screenshotPaths = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.originalname).toLowerCase();
      const newFileName = `screenshot-${i + 1}${ext}`;
      const newPath = path.join(screenshotsDir, newFileName);

      await fs.rename(file.path, newPath);
      screenshotPaths.push(newPath);
    }

    // Update database
    await query(
      'UPDATE apps SET screenshots = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [screenshotPaths, appId]
    );

    res.json({
      message: 'Screenshots uploadées avec succès',
      screenshots: screenshotPaths.map((p, i) => ({
        path: p,
        url: `/uploads/apps/${appId}/screenshots/screenshot-${i + 1}${path.extname(p)}`
      }))
    });
  } catch (error) {
    // Clean up temp files on error
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(() => {});
      }
    }
    next(error);
  }
}
