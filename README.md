# sandbox for Databricks on AWS and Azure

## Install Databricks CLI
- ```python3 -m pip install databricks-cli```
- Provide the token from Azure Databricks to the interactive CLI: ```databricks configure --token```
- Test the CLI by checking for the secret: ```databricks secrets list-scopes```
- Create secret scope: ```databricks secrets create-scope --scope myblob```
- Create secret: ```databricks secrets put --scope myblob --key my_access_key```
- Check ACL for secrets: ```databricks secrets list-acls --scope myblob```

Then use the "dbutils" to read the secret 
```
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
