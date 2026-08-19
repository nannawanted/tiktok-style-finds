function handleTikTokUrlChange(url: string) {
    setData((d) => ({ ...d, tiktok_url: url }));

    clearTimeout(tiktokDebounceRef.current);
    setTiktokNotice(null);
    if (!isTikTokUrl(url)) {
      setTiktokLoading(false);
      return;
    }

    tiktokDebounceRef.current = setTimeout(async () => {
      setTiktokLoading(true);
      try {
        const result = await fetchTikTokOembed({ data: { url } });
        if (result.thumbnail_url) {
          setData((d) => ({ ...d, cover_image: result.thumbnail_url }));
        } else {
          setTiktokNotice(
            "La miniature automatique ne marche que pour les vraies vidéos TikTok. Pour un post en slide (photos), TikTok ne fournit pas d'image via ce système : fais un clic droit sur une des photos du slide → \"Copier l'adresse de l'image\" → colle-la dans le champ \"URL image de couverture\" ci-dessous.",
          );
        }
      } catch {
        setTiktokNotice(
          "La miniature automatique ne marche que pour les vraies vidéos TikTok. Pour un post en slide (photos), TikTok ne fournit pas d'image via ce système : fais un clic droit sur une des photos du slide → \"Copier l'adresse de l'image\" → colle-la dans le champ \"URL image de couverture\" ci-dessous.",
        );
      } finally {
        setTiktokLoading(false);
      }
    }, URL_DEBOUNCE_MS);
  }
