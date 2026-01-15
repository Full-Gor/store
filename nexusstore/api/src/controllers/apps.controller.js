import { query, getAppFilePath } from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import fs from 'fs/promises';
import path from 'path';

// Helper to generate slug
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/apps
export async function getApps(req, res, next) {
  try {
    const { category, type, price, search, sort = 'newest', limit = 20, offset = 0 } = req.query;

    let sql = `
      SELECT a.*, u.name as developer_name
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      WHERE a.status = 'approved'
    `;
    const params = [];
    let paramIndex = 1;

    // Filters
    if (category && category !== 'all') {
      sql += ` AND a.category = $${paramIndex++}`;
      params.push(category);
    }

    if (type && type !== 'all') {
      sql += ` AND a.type = $${paramIndex++}`;
      params.push(type);
    }

    if (price === 'free') {
      sql += ` AND a.price = 0`;
    } else if (price === 'paid') {
      sql += ` AND a.price > 0`;
    }

    if (search) {
      sql += ` AND (a.name ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting
    const sortOptions = {
      newest: 'a.created_at DESC',
      popular: 'a.downloads DESC',
      rating: 'a.rating DESC',
      name: 'a.name ASC',
      price_low: 'a.price ASC',
      price_high: 'a.price DESC'
    };
    sql += ` ORDER BY ${sortOptions[sort] || sortOptions.newest}`;

    // Pagination
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) FROM apps WHERE status = 'approved'`;
    const countResult = await query(countSql);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      apps: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < total
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/apps/featured
export async function getFeaturedApps(req, res, next) {
  try {
    const result = await query(`
      SELECT a.*, u.name as developer_name
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      WHERE a.status = 'approved' AND (a.featured = TRUE OR a.is_hot = TRUE)
      ORDER BY a.downloads DESC
      LIMIT 10
    `);

    res.json({ apps: result.rows });
  } catch (error) {
    next(error);
  }
}

// GET /api/apps/categories
export async function getCategories(req, res, next) {
  try {
    const result = await query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM apps
      WHERE status = 'approved'
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({ categories: result.rows });
  } catch (error) {
    next(error);
  }
}

// GET /api/apps/:idOrSlug
export async function getApp(req, res, next) {
  try {
    const { idOrSlug } = req.params;

    // Check if UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const sql = `
      SELECT a.*, u.name as developer_name, u.email as developer_email
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      WHERE ${isUUID ? 'a.id' : 'a.slug'} = $1
    `;

    const result = await query(sql, [idOrSlug]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Application non trouvée');
    }

    const app = result.rows[0];

    // Don't expose pending/rejected apps to non-owners
    if (app.status !== 'approved' && (!req.user || req.user.id !== app.developer_id)) {
      throw new NotFoundError('Application non trouvée');
    }

    res.json(app);
  } catch (error) {
    next(error);
  }
}

// GET /api/apps/:id/download
export async function downloadApp(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM apps WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Application non trouvée');
    }

    const app = result.rows[0];

    if (app.status !== 'approved') {
      throw new NotFoundError('Application non disponible');
    }

    // Check if paid app requires purchase
    if (app.price > 0 && req.user) {
      const purchaseResult = await query(
        'SELECT id FROM purchases WHERE user_id = $1 AND app_id = $2 AND status = $3',
        [req.user.id, id, 'completed']
      );

      if (purchaseResult.rows.length === 0) {
        return res.status(402).json({ error: 'Achat requis pour télécharger cette application' });
      }
    } else if (app.price > 0 && !req.user) {
      return res.status(401).json({ error: 'Authentification requise pour les applications payantes' });
    }

    // Check if file exists
    if (!app.file_path) {
      throw new NotFoundError('Fichier non disponible');
    }

    try {
      await fs.access(app.file_path);
    } catch {
      throw new NotFoundError('Fichier non trouvé');
    }

    // Increment download counter
    await query('UPDATE apps SET downloads = downloads + 1 WHERE id = $1', [id]);

    // Log download
    await query(
      `INSERT INTO downloads (app_id, user_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [id, req.user?.id || null, req.ip, req.headers['user-agent']]
    );

    // Send file
    const fileName = `${app.slug}-${app.version}${path.extname(app.file_path)}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileBuffer = await fs.readFile(app.file_path);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
}

// POST /api/apps
export async function createApp(req, res, next) {
  try {
    const { name, description, short_description, category, price = 0, type, version } = req.body;
    const developerId = req.user.id;

    // Generate unique slug
    let slug = slugify(name);
    const existing = await query('SELECT id FROM apps WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const result = await query(
      `INSERT INTO apps (name, slug, description, short_description, category, price, type, version, developer_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`,
      [name, slug, description, short_description, category, price, type, version, developerId]
    );

    res.status(201).json({
      message: 'Application créée avec succès',
      app: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/apps/:id
export async function updateApp(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, short_description, category, price, version } = req.body;

    // Check ownership
    const appResult = await query('SELECT developer_id FROM apps WHERE id = $1', [id]);
    if (appResult.rows.length === 0) {
      throw new NotFoundError('Application non trouvée');
    }

    if (appResult.rows[0].developer_id !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenError('Vous ne pouvez pas modifier cette application');
    }

    const result = await query(
      `UPDATE apps SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         short_description = COALESCE($3, short_description),
         category = COALESCE($4, category),
         price = COALESCE($5, price),
         version = COALESCE($6, version),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, description, short_description, category, price, version, id]
    );

    res.json({
      message: 'Application mise à jour',
      app: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/apps/:id
export async function deleteApp(req, res, next) {
  try {
    const { id } = req.params;

    // Check ownership
    const appResult = await query('SELECT developer_id, file_path FROM apps WHERE id = $1', [id]);
    if (appResult.rows.length === 0) {
      throw new NotFoundError('Application non trouvée');
    }

    if (appResult.rows[0].developer_id !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenError('Vous ne pouvez pas supprimer cette application');
    }

    // Delete app record
    await query('DELETE FROM apps WHERE id = $1', [id]);

    // Try to delete files (don't fail if not found)
    try {
      const appDir = path.dirname(appResult.rows[0].file_path || '');
      if (appDir) {
        await fs.rm(appDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore file deletion errors
    }

    res.json({ message: 'Application supprimée' });
  } catch (error) {
    next(error);
  }
}

// GET /api/apps/developer/stats
export async function getDeveloperStats(req, res, next) {
  try {
    const developerId = req.user.id;

    const stats = await query(`
      SELECT
        COUNT(*) as total_apps,
        COALESCE(SUM(downloads), 0) as total_downloads,
        COALESCE(AVG(rating), 0) as avg_rating
      FROM apps
      WHERE developer_id = $1
    `, [developerId]);

    const revenue = await query(`
      SELECT COALESCE(SUM(amount - commission), 0) as total_revenue
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      WHERE a.developer_id = $1 AND p.status = 'completed'
    `, [developerId]);

    res.json({
      apps: parseInt(stats.rows[0].total_apps),
      downloads: parseInt(stats.rows[0].total_downloads),
      rating: parseFloat(stats.rows[0].avg_rating).toFixed(1),
      revenue: parseFloat(revenue.rows[0].total_revenue).toFixed(2)
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/apps/developer/apps
export async function getDeveloperApps(req, res, next) {
  try {
    const developerId = req.user.id;

    const result = await query(`
      SELECT * FROM apps
      WHERE developer_id = $1
      ORDER BY created_at DESC
    `, [developerId]);

    res.json({ apps: result.rows });
  } catch (error) {
    next(error);
  }
}

// GET /api/apps/:id/reviews
export async function getReviews(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.app_id = $1
      ORDER BY r.created_at DESC
    `, [id]);

    res.json({ reviews: result.rows });
  } catch (error) {
    next(error);
  }
}

// POST /api/apps/:id/reviews
export async function createReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if app exists
    const appResult = await query('SELECT id FROM apps WHERE id = $1 AND status = $2', [id, 'approved']);
    if (appResult.rows.length === 0) {
      throw new NotFoundError('Application non trouvée');
    }

    // Check if user already reviewed
    const existingReview = await query('SELECT id FROM reviews WHERE user_id = $1 AND app_id = $2', [userId, id]);
    if (existingReview.rows.length > 0) {
      // Update existing review
      const result = await query(
        `UPDATE reviews SET rating = $1, comment = $2
         WHERE user_id = $3 AND app_id = $4
         RETURNING *`,
        [rating, comment, userId, id]
      );

      // Update app rating
      await updateAppRating(id);

      return res.json({
        message: 'Avis mis à jour',
        review: result.rows[0]
      });
    }

    // Create new review
    const result = await query(
      `INSERT INTO reviews (user_id, app_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, id, rating, comment]
    );

    // Update app rating
    await updateAppRating(id);

    res.status(201).json({
      message: 'Avis ajouté',
      review: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// Helper to update app rating
async function updateAppRating(appId) {
  await query(`
    UPDATE apps SET
      rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE app_id = $1),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE app_id = $1)
    WHERE id = $1
  `, [appId]);
}
