
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_eof70OsTYIFZ@ep-floral-darkness-aeaknj5y-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function test() {
  const sql = neon(DATABASE_URL);
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('DB Connection Success:', result);
  } catch (error) {
    console.error('DB Connection Failed:', error);
  }
}

test();
