"""initial_tables

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2026-05-18 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── users table ───
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('department', sa.String(length=255), nullable=True),
        sa.Column('nim', sa.String(length=50), nullable=True),
        sa.Column('fakultas', sa.String(length=255), nullable=True),
        sa.Column('program', sa.String(length=255), nullable=True),
        sa.Column('semester', sa.Integer(), nullable=True),
        sa.Column('nip', sa.String(length=50), nullable=True),
        sa.Column('position', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('profile_picture_url', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=True),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('nim'),
        sa.UniqueConstraint('nip')
    )
    op.create_index(op.f('ix_users_department'), 'users', ['department'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_nim'), 'users', ['nim'], unique=True)
    op.create_index(op.f('ix_users_nip'), 'users', ['nip'], unique=True)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)

    # ─── form_templates table ───
    op.create_table(
        'form_templates',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('letter_type', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('fields', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_form_templates_is_active'), 'form_templates', ['is_active'], unique=False)
    op.create_index(op.f('ix_form_templates_letter_type'), 'form_templates', ['letter_type'], unique=False)

    # ─── submissions table ───
    op.create_table(
        'submissions',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('template_id', sa.UUID(), nullable=False),
        sa.Column('submitter_id', sa.UUID(), nullable=False),
        sa.Column('letter_type', sa.String(length=255), nullable=False),
        sa.Column('form_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('is_ordered_verification', sa.Boolean(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('rejected_by', sa.UUID(), nullable=True),
        sa.Column('rejected_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['rejected_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['submitter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['form_templates.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_submissions_letter_type'), 'submissions', ['letter_type'], unique=False)
    op.create_index(op.f('ix_submissions_status'), 'submissions', ['status'], unique=False)
    op.create_index(op.f('ix_submissions_submitted_at'), 'submissions', ['submitted_at'], unique=False)
    op.create_index(op.f('ix_submissions_submitter_id'), 'submissions', ['submitter_id'], unique=False)
    op.create_index(op.f('ix_submissions_template_id'), 'submissions', ['template_id'], unique=False)

    # ─── submission_verifiers table ───
    op.create_table(
        'submission_verifiers',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('submission_id', sa.String(length=50), nullable=False),
        sa.Column('verifier_id', sa.UUID(), nullable=False),
        sa.Column('verifier_order', sa.Integer(), nullable=True),
        sa.Column('verifier_role', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('signature_hash', sa.String(length=255), nullable=True),
        sa.Column('signature_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['verifier_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('submission_id', 'verifier_id', name='uq_submission_verifier')
    )
    op.create_index(op.f('ix_submission_verifiers_status'), 'submission_verifiers', ['status'], unique=False)
    op.create_index(op.f('ix_submission_verifiers_submission_id'), 'submission_verifiers', ['submission_id'], unique=False)
    op.create_index(op.f('ix_submission_verifiers_verifier_id'), 'submission_verifiers', ['verifier_id'], unique=False)

    # ─── attachments table ───
    op.create_table(
        'attachments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('submission_id', sa.String(length=50), nullable=True),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('file_hash', sa.String(length=255), nullable=True),
        sa.Column('uploaded_by', sa.UUID(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attachments_submission_id'), 'attachments', ['submission_id'], unique=False)

    # ─── activity_logs table ───
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('submission_id', sa.String(length=50), nullable=True),
        sa.Column('action_type', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activity_logs_action_type'), 'activity_logs', ['action_type'], unique=False)
    op.create_index(op.f('ix_activity_logs_submission_id'), 'activity_logs', ['submission_id'], unique=False)
    op.create_index(op.f('ix_activity_logs_user_id'), 'activity_logs', ['user_id'], unique=False)

    # ─── notifications table ───
    op.create_table(
        'notifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('submission_id', sa.String(length=50), nullable=True),
        sa.Column('type', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('action_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_is_read'), table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_activity_logs_user_id'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_submission_id'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_action_type'), table_name='activity_logs')
    op.drop_table('activity_logs')

    op.drop_index(op.f('ix_attachments_submission_id'), table_name='attachments')
    op.drop_table('attachments')

    op.drop_index(op.f('ix_submission_verifiers_verifier_id'), table_name='submission_verifiers')
    op.drop_index(op.f('ix_submission_verifiers_submission_id'), table_name='submission_verifiers')
    op.drop_index(op.f('ix_submission_verifiers_status'), table_name='submission_verifiers')
    op.drop_table('submission_verifiers')

    op.drop_index(op.f('ix_submissions_template_id'), table_name='submissions')
    op.drop_index(op.f('ix_submissions_submitter_id'), table_name='submissions')
    op.drop_index(op.f('ix_submissions_submitted_at'), table_name='submissions')
    op.drop_index(op.f('ix_submissions_status'), table_name='submissions')
    op.drop_index(op.f('ix_submissions_letter_type'), table_name='submissions')
    op.drop_table('submissions')

    op.drop_index(op.f('ix_form_templates_letter_type'), table_name='form_templates')
    op.drop_index(op.f('ix_form_templates_is_active'), table_name='form_templates')
    op.drop_table('form_templates')

    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_index(op.f('ix_users_nip'), table_name='users')
    op.drop_index(op.f('ix_users_nim'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_department'), table_name='users')
    op.drop_table('users')
