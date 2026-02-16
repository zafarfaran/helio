"""Supabase client factory."""

from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Create a Supabase client using the anon key."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_supabase_admin() -> Client:
    """Create a Supabase client using the service role key (admin)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
