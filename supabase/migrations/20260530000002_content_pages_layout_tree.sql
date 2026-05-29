-- Layout engine support for content_pages. Optional JSONB tree column.
-- Null = legacy page_blocks renderer applies. Non-null = layout engine
-- renderer walks the tree.
-- Project-Docs/Layout-Language.md §1, §3.

alter table content_pages add column layout_tree jsonb;

alter table content_pages
  add constraint content_pages_layout_tree_is_object_or_null
  check (layout_tree is null or jsonb_typeof(layout_tree) = 'object');

comment on column content_pages.layout_tree is
  'Layout language page tree (root LayoutNode + meta). When non-null, the storefront renders this tree via components/storefront/layout/Page.tsx instead of resolving page_blocks.';
