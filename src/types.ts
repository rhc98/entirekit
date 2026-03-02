export interface CheckpointMetadata {
  session_id?: string;
  checkpoint_id?: string;
  created_at?: string;
  branch?: string;
  token_usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_tokens?: number;
    cache_creation_tokens?: number;
    api_call_count?: number;
  };
  initial_attribution?: {
    agent_lines?: number;
    agent_percentage?: number;
    human_added?: number;
    human_modified?: number;
    total_committed?: number;
  };
  files_touched?: string[];
}

export interface FilterOptions {
  branch?: string;
  since?: string;   // YYYY-MM-DD
  until?: string;   // YYYY-MM-DD
  limit?: number;
}

export interface CommitEntry {
  hash: string;
  subject: string;
}
