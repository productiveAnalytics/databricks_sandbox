# sandbox for Databricks on AWS and Azure

## Install Databricks CLI
- ```python3 -m pip install databricks-cli```
- Provide the token from Azure Databricks to the interactive CLI: ```databricks configure --token```
- Test the CLI by checking for the secret: ```databricks secrets list-scopes```
- Create secret scope: ```databricks secrets create-scope --scope myblob```
- Create secret: ```databricks secrets put --scope myblob --key my_access_key```
- Check ACL for secrets: ```databricks secrets list-acls --scope myblob```

## Create folder and upload files (Note: databricks fs = dbfs)
```
databricks fs mkdirs dbfs:/Users/productive_analytics@databricks.com/data
databricks fs cp ~/Dev/data/member_account_info.csv dbfs:/Users/productive_analytics@databricks.com/data/member_account_info.csv
databricks fs ls dbfs:/Users/productive_analytics@databricks.com/data/
```

### In notebook
```
%python
display(dbutils.fs.ls('dbfs:/Users/productive_analytics@databricks.com/data/'))
```
which is same as
```
%fs
dbfs ls /Users/productive_analytics@databricks.com/data/
```

### Then use the "dbutils" to read the secret 
```
%python
val azure_blob_storage_dns = ".blob.core.windows.net"

val storageAccountName = "myazurestorageaccount"
val containerName = "myconatainer"
val relativeFilePath = "movies.csv"

val blobAccessKey = dbutils.secrets.get(scope="myblob", key="my_access_key")
spark.conf.set(
  "fs.azure.account.key."+ storageAccountName + azure_blob_storage_dns,
  blobAccessKey
)

val wasbs_path = "wasbs://"+ containerName + "@" + storageAccountName + azure_blob_storage_dns + "/" + relativeFilePath

val movies_df = spark.read
  .option("hader", "true")
  .csv(wasbs_path)
  
display(movies_df, 10)
```
