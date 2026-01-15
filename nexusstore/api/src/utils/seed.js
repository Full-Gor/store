import bcrypt from 'bcryptjs';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function seed() {
  console.log('Starting database seeding...\n');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'nexusstore',
    user: process.env.DB_USER || 'nexusstore_user',
    password: process.env.DB_PASSWORD
  });

  try {
    const client = await pool.connect();

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    await client.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET
        password = $2,
        name = $3,
        role = $4
    `, ['admin@nexusstore.com', adminPassword, 'Admin', 'admin']);
    console.log('  ✓ Admin user created (admin@nexusstore.com / admin123)');

    // Create demo developer
    console.log('Creating demo developer...');
    const devPassword = await bcrypt.hash('developer123', 12);
    const devResult = await client.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET
        password = $2,
        name = $3,
        role = $4
      RETURNING id
    `, ['dev@nexusstore.com', devPassword, 'Demo Developer', 'developer']);
    const developerId = devResult.rows[0].id;
    console.log('  ✓ Developer user created (dev@nexusstore.com / developer123)');

    // Create demo user
    console.log('Creating demo user...');
    const userPassword = await bcrypt.hash('user123', 12);
    await client.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['user@nexusstore.com', userPassword, 'Demo User', 'user']);
    console.log('  ✓ Demo user created (user@nexusstore.com / user123)');

    // Create sample apps
    console.log('Creating sample apps...');

    const apps = [
      {
        name: 'NexusChat',
        slug: 'nexuschat',
        description: 'Application de messagerie instantanée sécurisée avec chiffrement de bout en bout. Profitez de conversations privées et de groupes avec vos proches.',
        short_description: 'Messagerie sécurisée',
        category: 'Communication',
        price: 0,
        type: 'apk',
        version: '2.4.1',
        downloads: 125400,
        rating: 4.8,
        is_hot: true
      },
      {
        name: 'PhotoMaster Pro',
        slug: 'photomaster-pro',
        description: 'Éditeur photo professionnel avec filtres avancés et outils de retouche. Transformez vos photos en œuvres d\'art.',
        short_description: 'Éditeur photo pro',
        category: 'Photo & Vidéo',
        price: 4.99,
        type: 'apk',
        version: '3.1.0',
        downloads: 89000,
        rating: 4.6,
        is_hot: false
      },
      {
        name: 'FitTrack',
        slug: 'fittrack',
        description: 'Suivez vos activités sportives, votre alimentation et votre sommeil. Atteignez vos objectifs de santé.',
        short_description: 'Suivi fitness complet',
        category: 'Santé & Fitness',
        price: 2.99,
        type: 'pwa',
        version: '1.8.5',
        downloads: 234000,
        rating: 4.9,
        is_hot: true
      },
      {
        name: 'CodePad',
        slug: 'codepad',
        description: 'Éditeur de code léger avec coloration syntaxique et support multi-langage. Parfait pour coder en déplacement.',
        short_description: 'Éditeur de code mobile',
        category: 'Productivité',
        price: 0,
        type: 'pwa',
        version: '2.0.0',
        downloads: 67000,
        rating: 4.7,
        is_hot: false
      },
      {
        name: 'BudgetWise',
        slug: 'budgetwise',
        description: 'Gérez vos finances personnelles et suivez vos dépenses facilement. Visualisez votre budget en un coup d\'œil.',
        short_description: 'Gestion de budget',
        category: 'Finance',
        price: 1.99,
        type: 'apk',
        version: '4.2.0',
        downloads: 156000,
        rating: 4.5,
        is_hot: true
      },
      {
        name: 'MusicFlow',
        slug: 'musicflow',
        description: 'Lecteur de musique élégant avec égaliseur et support des playlists. Votre musique, votre style.',
        short_description: 'Lecteur de musique',
        category: 'Musique',
        price: 0,
        type: 'apk',
        version: '5.0.2',
        downloads: 98000,
        rating: 4.4,
        is_hot: false
      },
      {
        name: 'WorldExplorer',
        slug: 'worldexplorer',
        description: 'Découvrez des destinations de voyage et planifiez vos aventures. Guides hors-ligne inclus.',
        short_description: 'Guide de voyage',
        category: 'Voyage',
        price: 0,
        type: 'pwa',
        version: '1.5.0',
        downloads: 45000,
        rating: 4.3,
        is_hot: false
      },
      {
        name: 'SecureVault',
        slug: 'securevault',
        description: 'Gestionnaire de mots de passe sécurisé avec synchronisation cloud. Protégez vos données sensibles.',
        short_description: 'Gestionnaire de mots de passe',
        category: 'Utilitaires',
        price: 3.99,
        type: 'apk',
        version: '2.1.0',
        downloads: 78000,
        rating: 4.8,
        is_hot: true
      }
    ];

    for (const app of apps) {
      await client.query(`
        INSERT INTO apps (name, slug, description, short_description, category, price, type, version, downloads, rating, status, is_hot, developer_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', $11, $12)
        ON CONFLICT (slug) DO UPDATE SET
          downloads = $9,
          rating = $10,
          is_hot = $11
      `, [
        app.name, app.slug, app.description, app.short_description,
        app.category, app.price, app.type, app.version,
        app.downloads, app.rating, app.is_hot, developerId
      ]);
      console.log(`  ✓ Created app: ${app.name}`);
    }

    client.release();

    console.log('\n✓ Seeding completed successfully');
    console.log('\nDemo accounts:');
    console.log('  Admin:     admin@nexusstore.com / admin123');
    console.log('  Developer: dev@nexusstore.com / developer123');
    console.log('  User:      user@nexusstore.com / user123');
  } catch (error) {
    console.error('\n✗ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
