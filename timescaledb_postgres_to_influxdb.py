import pyspark
from pyspark.sql import SparkSession
from pyspark.sql import Row

POSTGRESQL_DIRVER_JAR_PATH = "/usr/local/postgresql-42.2.5.jar"

# load PostgreSQL driver jar
spark = SparkSession.builder
    .config("spark.jars", POSTGRESQL_DIRVER_JAR_PATH)
    .master("local")
    .appName("TimescaleDB_PostgreSQL_spark")
    .getOrCreate()
    
# read the TimescaleDB Hypertable data (Postgres table) 
tsdb_df = spark.read
    .format("jdbc")
    .option("url", "jdbc:postgresql://localhost:5432/dezyre_new")
    .option("driver", "org.postgresql.Driver")
    .option("dbtable", "drivers_data")
    .option("user", "timescaledb")
    .option("password", "timescaledb_admin")
    .load()
tsdb_df.printSchema()

# Convert from DB record to InfluxDB Line Protocol
