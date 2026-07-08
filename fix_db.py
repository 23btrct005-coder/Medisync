import psycopg2

conn = psycopg2.connect(
    dbname="postgres",
    user="postgres",
    password="Medisync2024",
    host="db.ggcecwmxxuhadtihmjxf.supabase.co",
    port="5432"
)
cur = conn.cursor()
cur.execute("UPDATE doctors SET institutional = false WHERE hospital_id IS NULL AND institutional = true;")
print(f"Rows updated: {cur.rowcount}")
conn.commit()
cur.close()
conn.close()
