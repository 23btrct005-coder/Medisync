import psycopg2

conn = psycopg2.connect(
    dbname="postgres",
    user="postgres",
    password="Medisync2024",
    host="db.ggcecwmxxuhadtihmjxf.supabase.co",
    port="5432"
)
cur = conn.cursor()
cur.execute("UPDATE doctors SET latitude = 12.9716, longitude = 77.5946 WHERE name LIKE '%Abishek%';")
conn.commit()
print("Updated coordinates.")
conn.close()
