"""Management CLI for nDrama.

Usage:
    python -m app.cli seed-admin --email admin@ndrama.com --password changeme123
"""

import argparse
import asyncio
import sys

from sqlalchemy import select

from app.database import async_session_maker, engine
from app.models.user import User, UserRole
from app.services.auth_service import hash_password


async def _seed_admin(email: str, password: str, name: str) -> None:
    async with async_session_maker() as session:
        result = await session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none() is not None:
            print(f"User with email '{email}' already exists. Skipping.")
            return

        user = User(
            email=email,
            password_hash=hash_password(password),
            name=name,
            role=UserRole.admin,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        print(f"Admin user '{email}' created successfully.")

    await engine.dispose()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="ndrama", description="nDrama management CLI")
    subparsers = parser.add_subparsers(dest="command")

    seed = subparsers.add_parser("seed-admin", help="Create a default admin user")
    seed.add_argument("--email", required=True, help="Admin email address")
    seed.add_argument("--password", required=True, help="Admin password")
    seed.add_argument("--name", default="Admin", help="Admin display name")

    args = parser.parse_args(argv)

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    if args.command == "seed-admin":
        asyncio.run(_seed_admin(args.email, args.password, args.name))
