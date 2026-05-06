-- Indexes for ai.users table
CREATE INDEX IF NOT EXISTS idx_users_username ON ai.users("username");
CREATE INDEX IF NOT EXISTS idx_users_email ON ai.users("email");
CREATE INDEX IF NOT EXISTS idx_users_roleId ON ai.users("roleId");
CREATE INDEX IF NOT EXISTS idx_users_flag ON ai.users("flag");

-- Indexes for ai.dokumentasi_db table  
CREATE INDEX IF NOT EXISTS idx_dokumentasi_dbType ON ai.dokumentasi_db("dbType");
CREATE INDEX IF NOT EXISTS idx_dokumentasi_title ON ai.dokumentasi_db("title");
CREATE INDEX IF NOT EXISTS idx_dokumentasi_flag ON ai.dokumentasi_db("flag");
CREATE INDEX IF NOT EXISTS idx_dokumentasi_authorId ON ai.dokumentasi_db("authorId");
CREATE INDEX IF NOT EXISTS idx_dokumentasi_aiGenerated ON ai.dokumentasi_db("aiGenerated");
CREATE INDEX IF NOT EXISTS idx_dokumentasi_version ON ai.dokumentasi_db("version");

-- Indexes for ai.log_activities table
CREATE INDEX IF NOT EXISTS idx_log_activities_userId ON ai.log_activities("userId");
CREATE INDEX IF NOT EXISTS idx_log_activities_action ON ai.log_activities("action");
CREATE INDEX IF NOT EXISTS idx_log_activities_module ON ai.log_activities("module");
CREATE INDEX IF NOT EXISTS idx_log_activities_created_at ON ai.log_activities("created_at");
CREATE INDEX IF NOT EXISTS idx_log_activities_flag ON ai.log_activities("flag");

-- Indexes for ai.roles table
CREATE INDEX IF NOT EXISTS idx_roles_name ON ai.roles("name");
CREATE INDEX IF NOT EXISTS idx_roles_flag ON ai.roles("flag");

-- Indexes for ai.apps_version table
CREATE INDEX IF NOT EXISTS idx_apps_version_appVersion ON ai.apps_version("appVersion");
CREATE INDEX IF NOT EXISTS idx_apps_version_flag ON ai.apps_version("flag");
CREATE INDEX IF NOT EXISTS idx_apps_version_createdAt ON ai.apps_version("createdAt");

-- Full-text search index for ai.dokumentasi_db (for grep search)
CREATE INDEX IF NOT EXISTS idx_dokumentasi_search ON ai.dokumentasi_db USING gin(to_tsvector('english', coalesce("title",'') || ' ' || coalesce("tutorial",'') || ' ' || coalesce("summary",'')));
