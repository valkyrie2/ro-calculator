-- Allow the public RPC wrapper to resolve the private helper function.
-- The `private` schema is not exposed through PostgREST; this only enables
-- direct function execution through the wrapper's SQL body.

grant usage on schema private to anon, authenticated;
