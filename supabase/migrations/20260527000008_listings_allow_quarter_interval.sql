-- Add 'quarter' to the allowed subscription_interval values. "Soap of the Season"
-- style quarterly subscriptions are a legitimate maker offering and we want the
-- AI to be able to suggest them.

alter table listings drop constraint if exists listings_subscription_interval_check;
alter table listings add constraint listings_subscription_interval_check
  check (subscription_interval is null or subscription_interval in ('week', 'month', 'quarter', 'year'));
