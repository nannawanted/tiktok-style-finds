-- Appliquée directement sur la base le 2026-11-27.
-- Les avis « look masqué / de nouveau visible » gardent l'identifiant du look (data.post)
-- pour afficher un bouton « Voir le look » dans les notifications du créateur.
-- (moderation.hide_look / moderation.unhide_look : jsonb_build_object(..., 'post', p_post))
update moderation_notices m set data = m.data || jsonb_build_object('post', p.id)
from posts p
where m.kind in ('post_hidden','post_unhidden') and not (m.data ? 'post')
  and p.creator_id = m.user_id and p.title = m.data->>'title'
  and (select count(*) from posts p2 where p2.creator_id = m.user_id and p2.title = m.data->>'title') = 1;
