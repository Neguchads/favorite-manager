import { AiBookmarkItem, AiProposedPlan, OllamaConfig } from './types';
import { queryOllama } from './ollama';
import { buildCategorizationPrompt } from './prompts';

export const TAXONOMY_MASTER_CATEGORIES = [
  'Programação, Dev & IA',
  'Jogos & Games',
  'Filmes, Séries & Animes',
  'Música',
  'Eletroeletrônica',
  'Mecânica & Engenharia',
  'Tecnologia & Informática',
  'Estudos & Educação',
  'Saúde, Fitness & Bem-Estar',
  'Negócios & Carreira',
  'Espiritualidade & Religião',
  'Governo & Cidadania',
  'Arte, Design & Personalização',
  'Lojas & Compras',
  'Turismo, Viagens & Eventos',
  'Redes Sociais & Comunicação',
  'Produtividade & Ferramentas',
  'Notícias & Atualidades',
] as const;

/**
 * High precision domain dictionary mapping directly to intelligent subfolders
 */
const DOMAIN_SUBFOLDER_MAP: Record<string, string> = {
  // Programação, Dev & IA
  'github.com': 'Programação, Dev & IA / Repositórios & Código',
  'gitlab.com': 'Programação, Dev & IA / Repositórios & Código',
  'bitbucket.org': 'Programação, Dev & IA / Repositórios & Código',
  'sourceforge.net': 'Programação, Dev & IA / Repositórios & Código',
  'gist.github.com': 'Programação, Dev & IA / Repositórios & Código',
  'stackoverflow.com': 'Programação, Dev & IA / Comunidade & Dúvidas',
  'stackexchange.com': 'Programação, Dev & IA / Comunidade & Dúvidas',
  'developer.mozilla.org': 'Programação, Dev & IA / Documentações & Guias',
  'w3schools.com': 'Programação, Dev & IA / Documentações & Guias',
  'devdocs.io': 'Programação, Dev & IA / Documentações & Guias',
  'learn.microsoft.com': 'Programação, Dev & IA / Documentações & Guias',
  'docs.microsoft.com': 'Programação, Dev & IA / Documentações & Guias',
  'developer.android.com': 'Programação, Dev & IA / Documentações & Guias',
  'devmedia.com.br': 'Programação, Dev & IA / Documentações & Guias',
  'linguagemc.com.br': 'Programação, Dev & IA / Documentações & Guias',
  'visualg3.com.br': 'Programação, Dev & IA / Documentações & Guias',
  'claude.ai': 'Programação, Dev & IA / Inteligência Artificial',
  'chatgpt.com': 'Programação, Dev & IA / Inteligência Artificial',
  'openai.com': 'Programação, Dev & IA / Inteligência Artificial',
  'ollama.com': 'Programação, Dev & IA / Inteligência Artificial',
  'huggingface.co': 'Programação, Dev & IA / Inteligência Artificial',
  'perplexity.ai': 'Programação, Dev & IA / Inteligência Artificial',
  'colab.research.google.com': 'Programação, Dev & IA / Inteligência Artificial',
  'kaggle.com': 'Programação, Dev & IA / Inteligência Artificial',
  'elevenlabs.io': 'Programação, Dev & IA / Inteligência Artificial',
  'suno.com': 'Programação, Dev & IA / Inteligência Artificial',
  'deepseekv3.net': 'Programação, Dev & IA / Inteligência Artificial',
  'deepseek.com': 'Programação, Dev & IA / Inteligência Artificial',
  'neuralwriter.com': 'Programação, Dev & IA / Inteligência Artificial',
  'quillbot.com': 'Programação, Dev & IA / Inteligência Artificial',
  'skills.sh': 'Programação, Dev & IA / Ferramentas & Dev Geral',
  'vercel.com': 'Programação, Dev & IA / Ferramentas & Dev Geral',
  'npmjs.com': 'Programação, Dev & IA / Ferramentas & Dev Geral',
  'pypi.org': 'Programação, Dev & IA / Ferramentas & Dev Geral',
  'docker.com': 'Programação, Dev & IA / Ferramentas & Dev Geral',
  'healthchecks.io': 'Programação, Dev & IA / Ferramentas & Dev Geral',

  // Jogos & Games
  'nexusmods.com': 'Jogos & Games / Mods & Comunidade',
  'mixmods.com.br': 'Jogos & Games / Mods & Comunidade',
  'curseforge.com': 'Jogos & Games / Mods & Comunidade',
  'modrinth.com': 'Jogos & Games / Mods & Comunidade',
  'mugenation.it': 'Jogos & Games / Mods & Comunidade',
  'mugenguild.com': 'Jogos & Games / Mods & Comunidade',
  'filterblade.xyz': 'Jogos & Games / Mods & Comunidade',
  'torrentgamesps3.net': 'Jogos & Games / Sony & PlayStation',
  'psxdownloads.us': 'Jogos & Games / Sony & PlayStation',
  'cdromance.com': 'Jogos & Games / Sony & PlayStation',
  'playstation.com': 'Jogos & Games / Sony & PlayStation',
  'nintendo.com': 'Jogos & Games / Nintendo',
  'xbox.com': 'Jogos & Games / Xbox',
  'coolrom.com.br': 'Jogos & Games / Emuladores & ROMs',
  'coolrom.com': 'Jogos & Games / Emuladores & ROMs',
  'vimm.net': 'Jogos & Games / Emuladores & ROMs',
  'retroarch.com': 'Jogos & Games / Emuladores & ROMs',
  'ppsspp.org': 'Jogos & Games / Emuladores & ROMs',
  'retroachievements.org': 'Jogos & Games / Emuladores & ROMs',
  'poe.ninja': 'Jogos & Games / Wikis, Guias & Databases',
  'poe2db.tw': 'Jogos & Games / Wikis, Guias & Databases',
  'poe2builder.com': 'Jogos & Games / Wikis, Guias & Databases',
  'craftofexile.com': 'Jogos & Games / Wikis, Guias & Databases',
  'mobalytics.gg': 'Jogos & Games / Wikis, Guias & Databases',
  'maxroll.gg': 'Jogos & Games / Wikis, Guias & Databases',
  'icy-veins.com': 'Jogos & Games / Wikis, Guias & Databases',
  'ign.com': 'Jogos & Games / Wikis, Guias & Databases',
  'gamevicio.com': 'Jogos & Games / Wikis, Guias & Databases',
  'aom.heavengames.com': 'Jogos & Games / Wikis, Guias & Databases',
  'store.steampowered.com': 'Jogos & Games / PC & Lojas',
  'steamcommunity.com': 'Jogos & Games / PC & Lojas',
  'steamdb.info': 'Jogos & Games / PC & Lojas',
  'epicgames.com': 'Jogos & Games / PC & Lojas',
  'gog.com': 'Jogos & Games / PC & Lojas',
  'fitgirl-repacks.site': 'Jogos & Games / PC & Lojas',
  'pathofexile.com': 'Jogos & Games / PC & Lojas',
  'roblox.com': 'Jogos & Games / PC & Lojas',
  'ea.com': 'Jogos & Games / PC & Lojas',
  'twitch.tv': 'Jogos & Games / PC & Lojas',

  // Música
  'cifraclub.com.br': 'Música / Partituras & Cifras',
  'songsterr.com': 'Música / Partituras & Cifras',
  'ultimateguitar.com': 'Música / Partituras & Cifras',
  'cifradventista.com': 'Música / CCB & Hinários',
  'congregacao.org.br': 'Música / CCB & Hinários',
  'musical.congregacao.org.br': 'Música / CCB & Hinários',
  'evangelizar2017.com.br': 'Música / CCB & Hinários',
  'spotify.com': 'Música / Streaming & Clássica',
  'open.spotify.com': 'Música / Streaming & Clássica',
  'deezer.com': 'Música / Streaming & Clássica',
  'music.apple.com': 'Música / Streaming & Clássica',
  'music.youtube.com': 'Música / Streaming & Clássica',
  'soundcloud.com': 'Música / Streaming & Clássica',
  'filarmonica.art.br': 'Música / Streaming & Clássica',

  // Eletroeletrônica
  'arduino.cc': 'Eletroeletrônica / Microcontroladores & DIY',
  'espressif.com': 'Eletroeletrônica / Microcontroladores & DIY',
  'raspberrypi.com': 'Eletroeletrônica / Microcontroladores & DIY',
  'easyeda.com': 'Eletroeletrônica / Circuitos & Esquemas',
  'kicad.org': 'Eletroeletrônica / Circuitos & Esquemas',
  'falstad.com': 'Eletroeletrônica / Circuitos & Esquemas',
  'fritzing.org': 'Eletroeletrônica / Circuitos & Esquemas',
  'alldatasheet.com': 'Eletroeletrônica / Componentes & Datasheets',
  'mouser.com': 'Eletroeletrônica / Componentes & Datasheets',
  'mouser.com.br': 'Eletroeletrônica / Componentes & Datasheets',
  'digikey.com': 'Eletroeletrônica / Componentes & Datasheets',
  'digikey.com.br': 'Eletroeletrônica / Componentes & Datasheets',
  'kostalbrasil.com.br': 'Eletroeletrônica / Componentes & Datasheets',

  // Mecânica & Engenharia
  'solidworks.com': 'Mecânica & Engenharia / CAD 3D & Modelagem',
  'autodesk.com': 'Mecânica & Engenharia / CAD 3D & Modelagem',
  'grabcad.com': 'Mecânica & Engenharia / CAD 3D & Modelagem',
  'thingiverse.com': 'Mecânica & Engenharia / CAD 3D & Modelagem',
  'printables.com': 'Mecânica & Engenharia / CAD 3D & Modelagem',
  'lojadomecanico.com.br': 'Mecânica & Engenharia / Usinagem & Ferramentas Pesadas',
  'mundomanuais.com': 'Mecânica & Engenharia / Usinagem & Ferramentas Pesadas',
  'bamaqmaquinas.com.br': 'Mecânica & Engenharia / Usinagem & Ferramentas Pesadas',
  'retroescavadeiras.net': 'Mecânica & Engenharia / Usinagem & Ferramentas Pesadas',
  'autopapo.uol.com.br': 'Mecânica & Engenharia / Automotiva & Veículos',
  'blogiveco.com.br': 'Mecânica & Engenharia / Automotiva & Veículos',
  'volvotrucks.com.br': 'Mecânica & Engenharia / Automotiva & Veículos',
  'chiptronic.com.br': 'Mecânica & Engenharia / Automotiva & Veículos',
  'site.vistoriapro.com.br': 'Mecânica & Engenharia / Técnico Mecânico & Inspeção',
  'arenatecnica.com': 'Mecânica & Engenharia / Técnico Mecânico & Inspeção',

  // Tecnologia & Informática
  'xdaforums.com': 'Tecnologia & Informática / Android & Dispositivos Móveis',
  'tudocelular.com': 'Tecnologia & Informática / Android & Dispositivos Móveis',
  'apkpure.com': 'Tecnologia & Informática / Android & Dispositivos Móveis',
  'm.apkpure.com': 'Tecnologia & Informática / Android & Dispositivos Móveis',
  'rexdl.com': 'Tecnologia & Informática / Android & Dispositivos Móveis',
  'nextpit.com.br': 'Tecnologia & Informática / Android & Dispositivos Móveis',
  'clubedohardware.com.br': 'Tecnologia & Informática / Hardware & Componentes',
  'hardware.com.br': 'Tecnologia & Informática / Hardware & Componentes',
  'hwinfo.com': 'Tecnologia & Informática / Hardware & Componentes',
  'egpu.io': 'Tecnologia & Informática / Hardware & Componentes',
  'coderbag.com': 'Tecnologia & Informática / Windows & Sistemas',
  'tailscale.com': 'Tecnologia & Informática / Redes & Segurança',
  'zerotier.com': 'Tecnologia & Informática / Redes & Segurança',
  'virustotal.com': 'Tecnologia & Informática / Redes & Segurança',
  'hybrid-analysis.com': 'Tecnologia & Informática / Redes & Segurança',
  'any.run': 'Tecnologia & Informática / Redes & Segurança',

  // Estudos & Educação
  'qconcursos.com': 'Estudos & Educação / Cursos & Concursos',
  'portaleduca.com.br': 'Estudos & Educação / Cursos & Concursos',
  'sestsenat.org.br': 'Estudos & Educação / Cursos & Concursos',
  'editalconcursosbrasil.com.br': 'Estudos & Educação / Cursos & Concursos',
  'guiadoestudante.abril.com.br': 'Estudos & Educação / Cursos & Concursos',
  'scribd.com': 'Estudos & Educação / Biblioteca & Livros (PDF)',
  'pdfcoffee.com': 'Estudos & Educação / Biblioteca & Livros (PDF)',
  'archive.org': 'Estudos & Educação / Biblioteca & Livros (PDF)',
  'books.google.com.br': 'Estudos & Educação / Biblioteca & Livros (PDF)',
  'plataforma.bvirtual.com.br': 'Estudos & Educação / Biblioteca & Livros (PDF)',
  'doceru.com': 'Estudos & Educação / Biblioteca & Livros (PDF)',
  'uninter.com': 'Estudos & Educação / Faculdades & Formação Técnica',
  'ead.senac.br': 'Estudos & Educação / Faculdades & Formação Técnica',
  'portaldoaluno.fatecie.edu.br': 'Estudos & Educação / Faculdades & Formação Técnica',
  'tecnicoporcompetencia.com.br': 'Estudos & Educação / Faculdades & Formação Técnica',
  'certificacaoporcompetencia.com.br': 'Estudos & Educação / Faculdades & Formação Técnica',
  'scilab.org': 'Estudos & Educação / Ciências Exatas',
  'maxima.sourceforge.io': 'Estudos & Educação / Ciências Exatas',
  'mathworks.com': 'Estudos & Educação / Ciências Exatas',
  'scholar.google.com': 'Estudos & Educação / Artigos & Normas Técnicas',
  'scholar.google.com.br': 'Estudos & Educação / Artigos & Normas Técnicas',
  'scielo.br': 'Estudos & Educação / Artigos & Normas Técnicas',
  'conjugacao.com.br': 'Estudos & Educação / Idiomas & Gramática',
  'pronounce.com': 'Estudos & Educação / Idiomas & Gramática',
  'jointoucan.com': 'Estudos & Educação / Idiomas & Gramática',

  // Saúde, Fitness & Bem-Estar
  'tuasaude.com': 'Saúde, Fitness & Bem-Estar / Medicina & Cuidados',
  'hapvida.com.br': 'Saúde, Fitness & Bem-Estar / Medicina & Cuidados',
  'doctorfeet.com.br': 'Saúde, Fitness & Bem-Estar / Medicina & Cuidados',
  'farmaciaeficacia.com.br': 'Saúde, Fitness & Bem-Estar / Medicina & Cuidados',
  'gsuplementos.com.br': 'Saúde, Fitness & Bem-Estar / Suplementos & Nutrição',
  'natusvita.com.br': 'Saúde, Fitness & Bem-Estar / Suplementos & Nutrição',
  'mutantnation.com': 'Saúde, Fitness & Bem-Estar / Suplementos & Nutrição',

  // Negócios & Carreira
  'itau.com.br': 'Negócios & Carreira / Finanças & Investimentos',
  'correspondenciasdigitais.itau.com.br': 'Negócios & Carreira / Finanças & Investimentos',
  'paypal.com': 'Negócios & Carreira / Finanças & Investimentos',
  'mercadopago.com.br': 'Negócios & Carreira / Finanças & Investimentos',
  'mepoupe.com': 'Negócios & Carreira / Finanças & Investimentos',
  'idinheiro.com.br': 'Negócios & Carreira / Finanças & Investimentos',
  'guardardinheiro.com.br': 'Negócios & Carreira / Finanças & Investimentos',
  'statusinvest.com.br': 'Negócios & Carreira / Finanças & Investimentos',
  'fundamentus.com.br': 'Negócios & Carreira / Finanças & Investimentos',
  'infomoney.com.br': 'Negócios & Carreira / Finanças & Investimentos',
  'b3.com.br': 'Negócios & Carreira / Finanças & Investimentos',
  'sebrae.com.br': 'Negócios & Carreira / Empreendedorismo & Marcas',
  'contabilizei.com.br': 'Negócios & Carreira / Empreendedorismo & Marcas',
  'registrodemarca.arenamarcas.com.br': 'Negócios & Carreira / Empreendedorismo & Marcas',
  'trademark-search.marcaria.com': 'Negócios & Carreira / Empreendedorismo & Marcas',
  'regify.global': 'Negócios & Carreira / Empreendedorismo & Marcas',
  'jobboard.universia.net': 'Negócios & Carreira / Empregos & Oportunidades',
  'vale.com': 'Negócios & Carreira / Empregos & Oportunidades',
  'careers.abb': 'Negócios & Carreira / Empregos & Oportunidades',
  'escolatrabalhador4.sharepoint.com': 'Negócios & Carreira / Empregos & Oportunidades',

  // Espiritualidade & Religião
  'amorc.org.br': 'Espiritualidade & Religião / Misticismo, Sonhos & Filosofia',
  'guiadaalma.com.br': 'Espiritualidade & Religião / Misticismo, Sonhos & Filosofia',
  'eusemfronteiras.com.br': 'Espiritualidade & Religião / Misticismo, Sonhos & Filosofia',
  'astrolink.com.br': 'Espiritualidade & Religião / Astrologia, Cabala & Numerologia',
  'viastral.com.br': 'Espiritualidade & Religião / Astrologia, Cabala & Numerologia',
  'personare.com.br': 'Espiritualidade & Religião / Astrologia, Cabala & Numerologia',
  'gematrialens.com': 'Espiritualidade & Religião / Astrologia, Cabala & Numerologia',
  'gematriacalculator.org': 'Espiritualidade & Religião / Astrologia, Cabala & Numerologia',
  'pathnumbers.com': 'Espiritualidade & Religião / Astrologia, Cabala & Numerologia',
  'cosmosdaily.co': 'Espiritualidade & Religião / Astrologia, Cabala & Numerologia',
  'abrame.org.br': 'Espiritualidade & Religião / Estudos Bíblicos & Fé',
  'apologeticavii.wordpress.com': 'Espiritualidade & Religião / Estudos Bíblicos & Fé',

  // Governo & Cidadania
  'detran.mg.gov.br': 'Governo & Cidadania / Detran & Trânsito',
  'seguradoralider.com.br': 'Governo & Cidadania / Detran & Trânsito',
  'gov.br': 'Governo & Cidadania / Serviços Públicos & Cidadania',
  'planalto.gov.br': 'Governo & Cidadania / Serviços Públicos & Cidadania',
  'vakinha.com.br': 'Governo & Cidadania / Serviços Públicos & Cidadania',

  // Filmes, Séries & Animes
  'crunchyroll.com': 'Filmes, Séries & Animes / Animes & Cultura Japonesa',
  'saikoani.me': 'Filmes, Séries & Animes / Animes & Cultura Japonesa',
  'animeq.blog': 'Filmes, Séries & Animes / Animes & Cultura Japonesa',
  'netflix.com': 'Filmes, Séries & Animes / Streaming & Players',
  'primevideo.com': 'Filmes, Séries & Animes / Streaming & Players',
  'starplus.com': 'Filmes, Séries & Animes / Streaming & Players',
  'stremio-addons.com': 'Filmes, Séries & Animes / Streaming & Players',
  'jellyfin.org': 'Filmes, Séries & Animes / Streaming & Players',
  'app.plex.tv': 'Filmes, Séries & Animes / Streaming & Players',
  'dailymotion.com': 'Filmes, Séries & Animes / Streaming & Players',
  'ondebaixa.com': 'Filmes, Séries & Animes / Torrents & Downloads',
  'reidostorrents.com': 'Filmes, Séries & Animes / Torrents & Downloads',
  'torrentclaw.com': 'Filmes, Séries & Animes / Torrents & Downloads',

  // Arte & Design
  'custom-cursor.com': 'Arte & Design / Personalização, Ícones & Wallpapers',
  'icon-icons.com': 'Arte & Design / Personalização, Ícones & Wallpapers',
  'getwallpapers.com': 'Arte & Design / Personalização, Ícones & Wallpapers',
  'wallhaven.cc': 'Arte & Design / Personalização, Ícones & Wallpapers',
  'alphacoders.com': 'Arte & Design / Personalização, Ícones & Wallpapers',
  'visualskins.com': 'Arte & Design / Personalização, Ícones & Wallpapers',
  'canva.com': 'Arte & Design / Design Gráfico & Ferramentas 3D',
  'free3d.com': 'Arte & Design / Design Gráfico & Ferramentas 3D',

  // Lojas & Compras
  'kabum.com.br': 'Lojas & Compras / Tecnologia & Hardware',
  'pichau.com.br': 'Lojas & Compras / Tecnologia & Hardware',
  'terabyteshop.com.br': 'Lojas & Compras / Tecnologia & Hardware',
  'pelando.com.br': 'Lojas & Compras / Cupons, Ofertas & Comparadores',
  'promobit.com.br': 'Lojas & Compras / Cupons, Ofertas & Comparadores',
  'zoom.com.br': 'Lojas & Compras / Cupons, Ofertas & Comparadores',
  'mercadolivre.com.br': 'Lojas & Compras / Marketplaces & Lojas Gerais',
  'amazon.com.br': 'Lojas & Compras / Marketplaces & Lojas Gerais',
  'shopee.com.br': 'Lojas & Compras / Marketplaces & Lojas Gerais',
  'aliexpress.com': 'Lojas & Compras / Marketplaces & Lojas Gerais',
  'casasbahia.com.br': 'Lojas & Compras / Marketplaces & Lojas Gerais',
  'netshoes.com.br': 'Lojas & Compras / Marketplaces & Lojas Gerais',

  // Produtividade & Ferramentas
  'ilovepdf.com': 'Produtividade & Ferramentas / Utilitários & Nuvem',
  'iloveimg.com': 'Produtividade & Ferramentas / Utilitários & Nuvem',
  'smallpdf.com': 'Produtividade & Ferramentas / Utilitários & Nuvem',
  'mega.nz': 'Produtividade & Ferramentas / Utilitários & Nuvem',
  'drive.google.com': 'Produtividade & Ferramentas / Utilitários & Nuvem',
  'keep.google.com': 'Produtividade & Ferramentas / Utilitários & Nuvem',
  'drivedepobre.com': 'Produtividade & Ferramentas / Utilitários & Nuvem',
  'miniwebtool.com': 'Produtividade & Ferramentas / Utilitários & Nuvem',
  'typeform.com': 'Produtividade & Ferramentas / Utilitários & Nuvem',
  '4devs.com.br': 'Produtividade & Ferramentas / Utilitários & Nuvem',

  // Turismo, Viagens & Eventos
  'booking.com': 'Turismo, Viagens & Eventos',
  'airbnb.com.br': 'Turismo, Viagens & Eventos',
  'decolar.com': 'Turismo, Viagens & Eventos',
  'skyscanner.com.br': 'Turismo, Viagens & Eventos',
  'rentalcars.com': 'Turismo, Viagens & Eventos',
  'eventim.com.br': 'Turismo, Viagens & Eventos',
  'expominasbh.com.br': 'Turismo, Viagens & Eventos',

  // Redes Sociais & Comunicação
  'web.whatsapp.com': 'Redes Sociais & Comunicação',
  'web.telegram.org': 'Redes Sociais & Comunicação',
  'reddit.com': 'Redes Sociais & Comunicação',
  'linkedin.com': 'Redes Sociais & Comunicação',
  'discord.com': 'Redes Sociais & Comunicação',
  'instagram.com': 'Redes Sociais & Comunicação',
  'linktr.ee': 'Redes Sociais & Comunicação',
  'mail.google.com': 'Redes Sociais & Comunicação',

  // Notícias & Atualidades
  'g1.globo.com': 'Notícias & Atualidades',
  'uol.com.br': 'Notícias & Atualidades',
  'folha.uol.com.br': 'Notícias & Atualidades',
  'cnnbrasil.com.br': 'Notícias & Atualidades',
  'bbc.com': 'Notícias & Atualidades',
};

/**
 * Extracts and normalizes search queries and AMP target paths from URLs
 */
function cleanUrlAndExtractContext(url: string, title: string, folderContext: string = ''): { fullText: string; domain: string } {
  let extraText = '';
  let domain = '';

  try {
    const u = new URL(url);
    domain = u.hostname.replace(/^www\./, '').toLowerCase();

    // Unpack Google AMP
    if (domain.includes('google.') && u.pathname.startsWith('/amp/s/')) {
      const realPath = u.pathname.replace('/amp/s/', '');
      extraText += ' ' + realPath.split('/').join(' ');
    }

    // Unpack search parameters
    if (u.searchParams.has('q')) extraText += ' ' + u.searchParams.get('q');
    if (u.searchParams.has('oq')) extraText += ' ' + u.searchParams.get('oq');
    if (u.searchParams.has('query')) extraText += ' ' + u.searchParams.get('query');
    if (u.searchParams.has('search')) extraText += ' ' + u.searchParams.get('search');
    if (u.searchParams.has('search_query')) extraText += ' ' + u.searchParams.get('search_query');

    // Path slug
    extraText += ' ' + u.pathname.replace(/[\/\-_.]+/g, ' ');
  } catch {}

  if (folderContext) {
    extraText += ' ' + folderContext.replace(/[\/\-_.]+/g, ' ');
  }

  const fullText = `${title || ''} ${domain} ${extraText}`.toLowerCase();
  return { fullText, domain };
}

/**
 * Deep semantic heuristic classification with hierarchical subfolders.
 * Optionally incorporates original folderContext to respect and normalize existing folder themes.
 */
export function classifyBookmarkIntelligently(title: string, url: string, folderContext: string = ''): string {
  const { fullText, domain } = cleanUrlAndExtractContext(url, title, folderContext);

  // 1. Direct or subdomain dictionary lookup
  if (DOMAIN_SUBFOLDER_MAP[domain]) {
    return DOMAIN_SUBFOLDER_MAP[domain];
  }
  for (const [keyDomain, targetFolder] of Object.entries(DOMAIN_SUBFOLDER_MAP)) {
    if (domain.endsWith(`.${keyDomain}`)) {
      return targetFolder;
    }
  }

  // 2. PROGRAMAÇÃO, DEV & IA (Master category with subfolders)
  const isAI =
    /\b(claude|chatgpt|openai|ollama|huggingface|llm|ia|ai|intelig[eê]ncia\s?artificial|prompt|neural|machine\s?learning|deep\s?learning|perplexity|midjourney|copilot|gemini|colaboratory|colab|elevenlabs|suno|sunoforge|deepseek|neuralwriter|quillbot|zerogpt|hunyuan|metademolab|labs\.google|multiagente|agentic|stable\s?diffusion)\b/i.test(
      fullText
    );
  const isDev =
    /\b(github|gitlab|bitbucket|stack\s?overflow|api|sdk|npm|pypi|docker|kubernetes|código|code|dev|frontend|backend|programar|programando|programação|programacao|linguagemc|visualg|c\+\+|c\#|python|javascript|typescript|react|vue|angular|java|php|sql|mysql|postgresql|sqlite|mongodb|algoritmo|algoritmos|css|html5|devmedia|portugol|android\s?studio|vscode|visual\s?studio|channel9|msdn|developer\.android|vulkan|ndk|vercel|skills\.sh|healthchecks\.io|tailscale|zerotier|akitaonrails|4devs)\b/i.test(
      fullText
    );

  if (isAI || isDev) {
    if (isAI && !/\b(c\+\+|c\#|python|javascript|visual\s?studio|portugol|github|gitlab)\b/i.test(fullText)) {
      return 'Programação, Dev & IA / Inteligência Artificial';
    }
    if (/\b(github|gitlab|bitbucket|reposit[oó]rio|gist|sourceforge)\b/i.test(fullText)) {
      return 'Programação, Dev & IA / Repositórios & Código';
    }
    if (/\b(stack\s?overflow|stackexchange|clube\s?do\s?hardware.*(c|c\+\+|java|python|c\#|sql|program)|forum|duvida|dúvida)\b/i.test(fullText)) {
      return 'Programação, Dev & IA / Comunidade & Dúvidas';
    }
    if (/\b(learn\.microsoft|docs\.microsoft|developer\.mozilla|devmedia|portugol|w3schools|devdocs|documenta[cç][aã]o|tutorial.*program|apostila.*program|linguagemc|visualg|algoritmo)\b/i.test(fullText)) {
      return 'Programação, Dev & IA / Documentações & Guias';
    }
    return 'Programação, Dev & IA / Ferramentas & Dev Geral';
  }

  // 3. JOGOS & GAMES (with subfolders)
  const isGame =
    /\b(nexusmods|fitgirl|torrentgamesps3|psxdownloads|mixmods|coolrom|steam|steampowered|epicgames|roblox|twitch|poe\.ninja|mobalytics|maxroll|elderscrolls|fallout|skyrim|ps[1-5]|playstation|xbox|nintendo|switch|game|jogos?|gameplay|emulador|rpcs3|pcsx2|retroarch|roms?|curseforge|modding|gamevicio|kotaku|voxel|speedrun|minecraft|diablo|elden\s?ring|dark\s?souls|gta|resident\s?evil|assassin'?s\s?creed|thewitcher|witcher|god\s?of\s?war|gran\s?turismo|gt6|horizon\s?zero|red\s?dead|pokemon|pokémon|zelda|mario|pathofexile|path\s?of\s?exile|poe2|poe\s?2|filterblade|craftofexile|poe2db|poe2builder|ppsspp|vimm\.net|cdromance|mugen|mugenation|mugenguild|modrinth|faithfulpack|inforcraft|terralith|aom\.heavengames|smite2|skse|soul\s?reaver|retroachievements|bonkerslots|icy-veins|overwolf|taskbarhero|filecrypt|ggmax|steamdb)\b/i.test(
      fullText
    );

  if (isGame) {
    if (/\b(ps[1-5]|playstation|psx|ps3|ps4|ps5|gt6|gran\s?turismo|torrentgamesps3|psxdownloads|sony|dualsense|dualshock|cdromance|soul\s?reaver)\b/i.test(fullText)) {
      return 'Jogos & Games / Sony & PlayStation';
    }
    if (/\b(nintendo|switch|wii|gamecube|n64|3ds|ds|zelda|mario|pok[eé]mon|metroid|citra|yuzu|snes)\b/i.test(fullText)) {
      return 'Jogos & Games / Nintendo';
    }
    if (/\b(xbox|game\s?pass|xbox\s?360|xbox\s?one|series\s?[xs]|halo|forza|gears)\b/i.test(fullText)) {
      return 'Jogos & Games / Xbox';
    }
    if (/\b(nexusmods|mixmods|curseforge|mods?|modding|enb|skse|modorganizer|vortex|shader|modrinth|faithfulpack|filterblade|mugen|mugenation|mugenguild)\b/i.test(fullText)) {
      return 'Jogos & Games / Mods & Comunidade';
    }
    if (/\b(coolrom|emulador|emulator|retroarch|rpcs3|pcsx2|roms?|bios|iso|ppsspp|vimm\.net|retroachievements)\b/i.test(fullText)) {
      return 'Jogos & Games / Emuladores & ROMs';
    }
    if (/\b(poe\.ninja|mobalytics|maxroll|fandom|skyrim|fallout|elderscrolls|wiki|guia|build|detonado|ign|gamevicio|poe2db|poe2builder|craftofexile|icy-veins|taskbarhero|timesaver|cheat)\b/i.test(fullText)) {
      return 'Jogos & Games / Wikis, Guias & Databases';
    }
    if (/\b(steam|epic\s?games|gog|fitgirl|itch\.io|roblox|pc\s?gamer|twitch|minecraft|path\s?of\s?exile|pathofexile|steamdb|ea\.com|capcom)\b/i.test(fullText)) {
      return 'Jogos & Games / PC & Lojas';
    }
    return 'Jogos & Games / Outros Games';
  }

  // 4. ELETROELETRÔNICA
  const isElectro =
    /\b(eletr[oô]nica|el[eé]trica|circuito|esquem[aá]tico|arduino|esp32|esp8266|raspberry|transistor|resistor|capacitor|diodo|kicad|easyeda|alldatasheet|mouser|digikey|datasheet|mult[ií]metro|oscilosc[oó]pio|aterramento|disjuntor|painel\s?solar|inversor|unifilar|eletricista|quadro\s?de\s?distribui[cç][aã]o|tinkercad|soldagem\s?eletr[oô]nica|transformador|bateria\s?18650|jammer|fio\/cabo|bitola|cabos?\s?el[eé]tricos?|amplificador|alto-falante|kostal)\b/i.test(
      fullText
    );

  if (isElectro) {
    if (/\b(arduino|esp32|esp8266|raspberry|microcontrolador|microcontroller|embarcados)\b/i.test(fullText)) {
      return 'Eletroeletrônica / Microcontroladores & DIY';
    }
    if (/\b(easyeda|kicad|proteus|fritzing|pcb|circuito|esquem[aá]tico|schematic|falstad)\b/i.test(fullText)) {
      return 'Eletroeletrônica / Circuitos & Esquemas';
    }
    if (/\b(alldatasheet|mouser|digikey|datasheet|transistor|capacitor|resistor|ci|ic|mosfet|diodo)\b/i.test(fullText)) {
      return 'Eletroeletrônica / Componentes & Datasheets';
    }
    if (/\b(aterramento|el[eé]trica|eletricista|disjuntor|unifilar|quadro|inversor|energia\s?solar|fotovoltaic|cabos?\s?el[eé]tricos?|bitola|transformador)\b/i.test(fullText)) {
      return 'Eletroeletrônica / Instalações Elétricas & Aterramento';
    }
    return 'Eletroeletrônica / Geral';
  }

  // 5. MECÂNICA & ENGENHARIA
  const isMech =
    /\b(mec[aâ]nica|automotivo|automotiva|autopapo|ve[ií]culo|scania|trator|tractor|usinagem|torno|fresa|cnc|solidworks|autodesk|grabcad|thingiverse|printables|motor|motores|oficina|lojadomecanico|pe[cç]as\s?auto|chassi|freio|suspens[aã]o|inspe[cç][aã]o\s?veicular|t[eé]cnico\s?mec[aâ]nico|c[aâ]mbio|embreagem|inje[cç][aã]o\s?eletr[oô]nica|torque|gestauto|iveco|caminh[aã]o|motoniveladora|retroescavadeira|escavadeira|caterpillar|komatsu|john\s?deere|volvo\s?trucks|mercedes.*axor|pneu|calibragem|óleo.*caminhão|vistoriapro|seguradora\s?lider|dpvat|kartodromo|reboque|volkswagenag|elsa2go|koenigsegg|porsche|rennsport|sedan|bmw)\b/i.test(
      fullText
    );

  if (isMech) {
    if (/\b(solidworks|grabcad|autocad|fusion|thingiverse|printables|3d|cad|cam|modelagem|perspectiva\s?isom[eé]trica)\b/i.test(fullText)) {
      return 'Mecânica & Engenharia / CAD 3D & Modelagem';
    }
    if (/\b(usinagem|torno|fresa|cnc|ret[ií]fica|ferramentas?|lojadomecanico|equipamentos|mundomanuais|motoniveladora|retroescavadeira|escavadeira|caterpillar|komatsu|chave\s?para\s?escavadeira)\b/i.test(fullText)) {
      return 'Mecânica & Engenharia / Usinagem & Ferramentas Pesadas';
    }
    if (/\b(inspe[cç][aã]o\s?veicular|t[eé]cnico\s?mec[aâ]nico|manuten[cç][aã]o\s?mec[aâ]nica|abnt|senai|gestauto|ficha\s?de\s?inspeção|vistoriapro|norma\s?t[eé]cnica\s?din)\b/i.test(fullText)) {
      return 'Mecânica & Engenharia / Técnico Mecânico & Inspeção';
    }
    if (/\b(autopapo|ve[ií]culo|carro|moto|scania|trator|caminh[aã]o|motor|c[aâ]mbio|suspens[aã]o|oficina|freio|chassi|iveco|volvo|mercedes|pneu|calibragem|nissan|koenigsegg|porsche|gol\s?1\.0|bmw)\b/i.test(fullText)) {
      return 'Mecânica & Engenharia / Automotiva & Veículos';
    }
    return 'Mecânica & Engenharia / Geral';
  }

  // 6. MÚSICA
  const isMusic =
    /\b(m[uú]sica|music|som|audio|[aá]udio|spotify|deezer|cifraclub|violino|viola|viol[aã]o|teclado|piano|luthier|partitura|partituras|solfejo|hin[aá]rio|hinos?|ccb|congregacao\s?crista|cifra|tablatura|songsterr|sound|acorde|afina[cç][aã]o|nota\s?l[aá]|440\s?hz|bach|chaconne|cello|pozzoli|orquestra|filarmonica|tocata|sinfonia|cifradventista|muse\s?sounds)\b/i.test(
      fullText
    );

  if (isMusic) {
    if (/\b(ccb|congregacao\s?crista|hinos?|hin[aá]rio|ensaios?|reuni[aã]o\s?de\s?jovens|sistema\s?de\s?administra[cç][aã]o\s?musical|evangelizarccb|cifradventista)\b/i.test(fullText)) {
      return 'Música / CCB & Hinários';
    }
    if (/\b(violino|viola|viol[aã]o|teclado|piano|luthier|instrumentos?|cravelha|espalheira|arco|cordas|cello)\b/i.test(fullText)) {
      return 'Música / Instrumentos & Luthiaria';
    }
    if (/\b(partitura|partituras|cifra|cifras|tablatura|cifraclub|songsterr|ultimate\s?guitar|sheet)\b/i.test(fullText)) {
      return 'Música / Partituras & Cifras';
    }
    if (/\b(teoria|solfejo|bona|escalas|harmonia|compasso|ritmo|pozzoli|440\s?hz|afina[cç][aã]o|tonalidades)\b/i.test(fullText)) {
      return 'Música / Teoria & Solfejo';
    }
    if (/\b(spotify|deezer|youtube\s?music|soundcloud|bandcamp|orquestra|filarmonica|sinfonia|bach)\b/i.test(fullText)) {
      return 'Música / Streaming & Clássica';
    }
    return 'Música / Geral';
  }

  // 7. TECNOLOGIA & INFORMÁTICA
  const isTech =
    /\b(android|samsung|motorola|xiaomi|smartphone|celular|windows|formatar|formata[cç][aã]o|bios|driver|drivers|intel|amd|ryzen|geforce|rtx|gtx|processador|placa\s?m[aã]e|mem[oó]ria\s?ram|ssd|hd|pendrive|hardware|clubedohardware|hardware\.com|techtudo|canaltech|olhar\s?digital|oficinadanet|tudocelular|nextpit|apkpure|rexdl|apkmirror|root|magisk|twrp|bootloader|rom\s?custom|firmware|192\.168|roteador|modem|wi-?fi|rede|dns|ip|airdroid|remotedesktop|anydesk|teamviewer|xdaforums|hwinfo|egpu|quickcpu|can\s?you\s?run\s?it|virustotal|hybrid-analysis|any\.run|edge\s?extensions|microsoftedge|truecaller)\b/i.test(
      fullText
    );

  if (isTech) {
    if (/\b(android|samsung|motorola|xiaomi|celular|smartphone|apk|apkpure|rexdl|root|magisk|twrp|bootloader|rom\s?custom|tudocelular|xdaforums|truecaller)\b/i.test(fullText)) {
      return 'Tecnologia & Informática / Android & Dispositivos Móveis';
    }
    if (/\b(windows|formatar|formata[cç][aã]o|driver|drivers|office|word|excel|sistema\s?operacional|powershell|cmd|quickcpu|microsoftedge)\b/i.test(fullText)) {
      return 'Tecnologia & Informática / Windows & Sistemas';
    }
    if (/\b(hardware|clubedohardware|intel|amd|ryzen|geforce|processador|placa\s?m[aã]e|mem[oó]ria\s?ram|ssd|fonte|perif[eé]ricos|hwinfo|egpu|can\s?you\s?run\s?it)\b/i.test(fullText)) {
      return 'Tecnologia & Informática / Hardware & Componentes';
    }
    if (/\b(192\.168|roteador|modem|wi-?fi|rede|dns|ip|airdroid|remotedesktop|anydesk|virustotal|hybrid-analysis|any\.run)\b/i.test(fullText)) {
      return 'Tecnologia & Informática / Redes & Segurança';
    }
    return 'Tecnologia & Informática / Geral';
  }

  // 8. SAÚDE, FITNESS & BEM-ESTAR
  const isHealth =
    /\b(sa[uú]de|fitness|suplemento|suplementos|emagrecimento|perder\s?barriga|dieta|prote[ií]na|tuasaude|natusvita|gsuplementos|growth|treino|muscula[cç][aã]o|academia|receita|receitas|rem[eé]dio|medicamento|hapvida|m[eé]dico|hospital|nutri|calorias|vitaminas?|anatomia|peso|jejum|carboidrato|creatina|whey|mutant\s?mass|calos|doctor\s?feet|farmacia|l'oreal|glandulas\s?sebaceas|astigmatismo|lenscope|óculos)\b/i.test(
      fullText
    );

  if (isHealth) {
    if (/\b(suplemento|suplementos|prote[ií]na|creatina|whey|natusvita|gsuplementos|growth|vitaminas?|mutant\s?mass)\b/i.test(fullText)) {
      return 'Saúde, Fitness & Bem-Estar / Suplementos & Nutrição';
    }
    if (/\b(fitness|treino|muscula[cç][aã]o|academia|exerc[ií]cio|emagrecimento|perder\s?barriga|peso)\b/i.test(fullText)) {
      return 'Saúde, Fitness & Bem-Estar / Fitness & Treinos';
    }
    if (/\b(receita|receitas|culin[aá]ria|alimento|alimentos|ch[aá]|suco|comida|dieta|carboidrato)\b/i.test(fullText)) {
      return 'Saúde, Fitness & Bem-Estar / Receitas Saudáveis';
    }
    if (/\b(tuasaude|hapvida|m[eé]dico|hospital|rem[eé]dio|medicamento|sintoma|sintomas|doen[cç]a|exame|anatomia|doctor\s?feet|farmacia|lenscope|óculos)\b/i.test(fullText)) {
      return 'Saúde, Fitness & Bem-Estar / Medicina & Cuidados';
    }
    return 'Saúde, Fitness & Bem-Estar / Geral';
  }

  // 9. ESTUDOS & EDUCAÇÃO
  const isEdu =
    /\b(estudo|estudos|curso|cursos|concurso|concursos|portaleduca|sestsenat|enem|fuvest|vestibular|prova|scribd|pdfcoffee|archive\.org|z-lib|livro|livros|biblioteca|faculdade|universidade|uninter|estacio|fatecie|senac|mec|e-mec|abnt|scielo|scholar|idioma|idiomas|ingl[eê]s|portugu[eê]s|gram[aá]tica|matem[aá]tica|f[ií]sica|qu[ií]mica|filosofia|hist[oó]ria|biologia|fauna|flora|artigo|tese|aula|aulas|geometria|c[aá]lculo|lacconcursos|mesalva|guiadoestudante|qconcursos|bvirtual|scilab|maxima|matlab|worldcat|doceru|conjugacao|abed|documento\s?do\s?estudante|forma\s?brasil|certifica[cç][aã]o\s?por\s?compet[eê]ncia|ietaam|pronounce|toucan|memorizar)\b/i.test(
      fullText
    );

  if (isEdu) {
    if (/\b(concurso|concursos|enem|fuvest|vestibular|portaleduca|sestsenat|lacconcursos|mesalva|guiadoestudante|qconcursos|prova|gabarito|edital|quest[aã]o)\b/i.test(fullText)) {
      return 'Estudos & Educação / Cursos & Concursos';
    }
    if (/\b(scribd|pdfcoffee|archive\.org|biblioteca|livro|livros|pdf|e-?book|apostila|leitura|books\.google|bvirtual|worldcat|doceru)\b/i.test(fullText)) {
      return 'Estudos & Educação / Biblioteca & Livros (PDF)';
    }
    if (/\b(faculdade|universidade|uninter|estacio|fatecie|senac|e-?mec|mec\.gov|gradua[cç][aã]o|p[oó]s-gradua[cç][aã]o|forma\s?brasil|certifica[cç][aã]o\s?por\s?compet[eê]ncia|ietaam|abed)\b/i.test(fullText)) {
      return 'Estudos & Educação / Faculdades & Formação Técnica';
    }
    if (/\b(abnt|scielo|scholar|artigo\s?cient[ií]fico|tese|disserta[cç][aã]o|norma\s?t[eé]cnica)\b/i.test(fullText)) {
      return 'Estudos & Educação / Artigos & Normas Técnicas';
    }
    if (/\b(idioma|idiomas|ingl[eê]s|english|portugu[eê]s|gram[aá]tica|dicion[aá]rio|vocabulary|pronounce|toucan|conjugacao)\b/i.test(fullText)) {
      return 'Estudos & Educação / Idiomas & Gramática';
    }
    if (/\b(matem[aá]tica|f[ií]sica|qu[ií]mica|c[aá]lculo|geometria|[aá]lgebra|scilab|maxima|matlab)\b/i.test(fullText)) {
      return 'Estudos & Educação / Ciências Exatas';
    }
    if (/\b(filosofia|hist[oó]ria|sociologia|geografia)\b/i.test(fullText)) {
      return 'Estudos & Educação / Humanas & Filosofia';
    }
    if (/\b(biologia|fauna|flora|animais|plantas)\b/i.test(fullText)) {
      return 'Estudos & Educação / Biologia & Ciências';
    }
    return 'Estudos & Educação / Geral';
  }

  // 10. NEGÓCIOS & CARREIRA
  const isBusiness =
    /\b(sebrae|contabilizei|cnpj|mei|abrir\s?empresa|empresa|neg[oó]cio|emprego|empregos|vagas?|trabalho|curr[ií]culo|banco|investimento|b3|statusinvest|fundamentus|infomoney|bv\.com|meutudo|arpejo|renda|finan[cç]as|paypal|ita[uú]|mercadopago|mepoupe|guardardinheiro|abac|idinheiro|consorcio|aluguel|financiamento|inpi|marca|patente|registrodemarca|zendesk|b2b|universia|carreiras|aterpa|escola\s?do\s?trabalhador|ponto\s?mais|f[eé]rias|minimum-wage|green\s?card|vale\.com|abb|hotmart)\b/i.test(
      fullText
    );

  if (isBusiness) {
    if (/\b(sebrae|contabilizei|cnpj|mei|abrir\s?empresa|contabilidade|empresa|neg[oó]cio|inpi|marcas?|patente|zendesk|b2b)\b/i.test(fullText)) {
      return 'Negócios & Carreira / Empreendedorismo & Marcas';
    }
    if (/\b(emprego|empregos|vagas?|trabalho|curr[ií]culo|contrata|processo\s?seletivo|universia|carreiras|vale\.com|escola\s?do\s?trabalhador|abb|green\s?card)\b/i.test(fullText)) {
      return 'Negócios & Carreira / Empregos & Oportunidades';
    }
    if (/\b(banco|investimento|investir|b3|statusinvest|fundamentus|infomoney|ações|fiis|tesouro|carteira|cr[eé]dito|empr[eé]stimo|renda|paypal|ita[uú]|mercadopago|mepoupe|guardardinheiro|abac|idinheiro|financiamento|hotmart)\b/i.test(fullText)) {
      return 'Negócios & Carreira / Finanças & Investimentos';
    }
    return 'Negócios & Carreira / Geral';
  }

  // 11. ESPIRITUALIDADE & RELIGIÃO
  const isReligion =
    /\b(b[ií]blia|estudosdabiblia|congregacaocristanobrasil|conteudoespirita|emsonho|sonhos?\.com|guiadaalma|evangelho|deus|ora[cç][aã]o|espiritismo|espiritualidade|teologia|mitologia|lendas|folclore|amorc|rosacruz|abrame|v[oó]s\s?sois\s?deuses|gematria|astrologia|hor[oó]scopo|mapa\s?astral|astrolink|viastral|personare|numerologia|kabbalah|cabala|sacramentos|significado\s?espiritual)\b/i.test(
      fullText
    );

  if (isReligion) {
    if (/\b(b[ií]blia|estudosdabiblia|congregacao|hino|vers[ií]culo|evangelho|teologia|apologetica|exodo|sacramentos)\b/i.test(fullText)) {
      return 'Espiritualidade & Religião / Estudos Bíblicos & Fé';
    }
    if (/\b(astrologia|hor[oó]scopo|mapa\s?astral|astrolink|viastral|personare|numerologia|kabbalah|cabala|gematria|fases\s?da\s?lua|calendario\s?lunar)\b/i.test(fullText)) {
      return 'Espiritualidade & Religião / Astrologia, Cabala & Numerologia';
    }
    if (/\b(sonho|sonhos|significado\s?dos\s?sonhos|espiritismo|espirita|guiadaalma|amorc|rosacruz|mitologia|lendas|folclore)\b/i.test(fullText)) {
      return 'Espiritualidade & Religião / Misticismo, Sonhos & Filosofia';
    }
    return 'Espiritualidade & Religião / Geral';
  }

  // 12. GOVERNO & CIDADANIA
  const isGov =
    /\b(gov\.br|detran|detran\.mg|planalto|prefeitura|contagem|fazenda|receita\s?federal|cnh|ipva|multa|legisla[cç][aã]o|lei|decreto|di[aá]rio\s?oficial|título\s?de\s?eleitor|inss|previd[eê]ncia|vakinha|crea|confea|resolvvi)\b/i.test(
      fullText
    );

  if (isGov) {
    if (/\b(detran|cnh|ipva|multa|ve[ií]culo|tr[aâ]nsito)\b/i.test(fullText)) {
      return 'Governo & Cidadania / Detran & Trânsito';
    }
    return 'Governo & Cidadania / Serviços Públicos & Cidadania';
  }

  // 13. FILMES, SÉRIES & ANIMES
  const isCinema =
    /\b(filme|filmes|s[eé]rie|s[eé]ries|anime|animes|netflix|primevideo|disney\+|max|hbomax|crunchyroll|imdb|letterboxd|cinema|torrent|ondebaixa|reidostorrents|comando\s?torrents|torrentclaw|stremio|plex|jellyfin|saikoani|dailymotion|star\+|origem|sherlock\s?holmes|alem\s?da\s?linha|prendame|yu\s?yu\s?hakusho)\b/i.test(
      fullText
    );

  if (isCinema) {
    if (/\b(anime|animes|crunchyroll|manga|saikoani|yu\s?yu\s?hakusho)\b/i.test(fullText)) {
      return 'Filmes, Séries & Animes / Animes & Cultura Japonesa';
    }
    if (/\b(torrent|ondebaixa|reidostorrents|torrentclaw|download)\b/i.test(fullText)) {
      return 'Filmes, Séries & Animes / Torrents & Downloads';
    }
    if (/\b(stremio|plex|jellyfin|star\+|netflix|primevideo|disney\+|max)\b/i.test(fullText)) {
      return 'Filmes, Séries & Animes / Streaming & Players';
    }
    return 'Filmes, Séries & Animes / Geral';
  }

  // 14. ARTE, DESIGN & PERSONALIZAÇÃO
  const isArt =
    /\b(arte|artes|desenho|pintura|escultura|arquitetura|design|designer|decora[cç][aã]o|planta\s?baixa|fachada|hq|quadrinhos|comic|manga|mang[aá]|deviantart|artstation|canva|inkscape|custom-cursor|cursor|icon-icons|ícones|wallpaper|wallpapers|wallhaven|alphacoders|visualskins|rainmeter|free3d|3d\s?models|blender)\b/i.test(
      fullText
    );

  if (isArt) {
    if (/\b(custom-cursor|cursor|icon-icons|ícones|wallpaper|wallpapers|wallhaven|alphacoders|visualskins|rainmeter|betterdiscord)\b/i.test(fullText)) {
      return 'Arte & Design / Personalização, Ícones & Wallpapers';
    }
    if (/\b(arquitetura|planta\s?baixa|fachada|decora[cç][aã]o|reforma|constru[cç][aã]o)\b/i.test(fullText)) {
      return 'Arte & Design / Arquitetura & Construção';
    }
    if (/\b(hq|quadrinhos|comic|manga|mang[aá]|universo\s?hq)\b/i.test(fullText)) {
      return 'Arte & Design / Quadrinhos & HQs';
    }
    return 'Arte & Design / Design Gráfico & Ferramentas 3D';
  }

  // 15. LOJAS & COMPRAS
  const isShop =
    /\b(loja|lojas|produto|produtos|mercadolivre|amazon|shopee|aliexpress|kabum|pichau|terabyte|superepi|perfumaria|perfume|fragr[aâ]ncia|comprar|compras|pre[cç]o|promo[cç][aã]o|desconto|cupom|pelando|promobit|carrinho|pedido|correios|inktec|casas\s?bahia|zoom|netshoes|olx|ravvisa)\b/i.test(
      fullText
    );

  if (isShop) {
    if (/\b(perfumaria|perfume|fragr[aâ]ncia|eau\s?de|col[oô]nia|cosm[eé]tico)\b/i.test(fullText)) {
      return 'Lojas & Compras / Perfumaria & Cuidados';
    }
    if (/\b(kabum|terabyte|pichau|hardware|computador|eletr[oô]nicos|inktec)\b/i.test(fullText)) {
      return 'Lojas & Compras / Tecnologia & Hardware';
    }
    if (/\b(pelando|promobit|cupom|cupons|desconto|oferta|zoom)\b/i.test(fullText)) {
      return 'Lojas & Compras / Cupons, Ofertas & Comparadores';
    }
    return 'Lojas & Compras / Marketplaces & Lojas Gerais';
  }

  // 16. PRODUTIVIDADE & FERRAMENTAS
  if (
    /\b(conversor|calculadora|tradutor|translate|speedtest|teste\s?de\s?velocidade|encurtador|gerador|takeout|drive\.google|onedrive|dropbox|mega\.nz|ilovepdf|iloveimg|smallpdf|miniwebtool|typeform|aspose|drivedepobre|keep\.google|forms|spreadsheets|planilha)\b/i.test(
      fullText
    )
  ) {
    return 'Produtividade & Ferramentas / Utilitários & Nuvem';
  }

  // 17. TURISMO, VIAGENS & EVENTOS
  if (
    /\b(viagem|viagens|turismo|hotel|hot[eé]is|pousada|voo|voos|a[eé]reo|passagem|booking|airbnb|decolar|skyscanner|tripadvisor|praia|milhas|assistentedeviagem|rentalcars|expominas|museudecongonhas|eventim|ingressos)\b/i.test(
      fullText
    )
  ) {
    return 'Turismo, Viagens & Eventos';
  }

  // 18. REDES SOCIAIS & COMUNICAÇÃO
  if (
    /\b(whatsapp|telegram|instagram|facebook|twitter|reddit|linkedin|tiktok|discord|linktr\.ee|gmail|mail\.google|outlook)\b/i.test(
      fullText
    )
  ) {
    return 'Redes Sociais & Comunicação';
  }

  // 19. NOTÍCIAS & ATUALIDADES
  if (/\b(not[ií]cia|not[ií]cias|g1|uol|folha|estadao|cnn|bbc|jornal|worldometers)\b/i.test(fullText)) {
    return 'Notícias & Atualidades';
  }

  return 'Outros & Geral';
}

/**
 * Hybrid classifier: Supports ultra-fast local semantic engine (instantaneous for 3500+ items)
 * or batched Ollama LLM execution with live progress reporting.
 */
export async function generateAiPlan(
  items: AiBookmarkItem[],
  existingFolderNames: Set<string>,
  config?: OllamaConfig,
  engine: 'semantic' | 'ollama' = 'semantic',
  onProgress?: (current: number, total: number) => void
): Promise<{ plan: AiProposedPlan; usedOllama: boolean }> {
  let usedOllama = false;
  let classifications: Array<{ id: string; suggestedFolder: string; suggestedTitle?: string }> = [];

  // 1. If Ollama requested and available, process in small batches of 20 to avoid context blowup
  if (engine === 'ollama' && config) {
    const OLLAMA_BATCH_SIZE = 20;
    try {
      for (let i = 0; i < items.length; i += OLLAMA_BATCH_SIZE) {
        const batch = items.slice(i, i + OLLAMA_BATCH_SIZE);
        const prompt = buildCategorizationPrompt(batch);
        const rawResponse = await queryOllama(prompt, config);
        const parsed = JSON.parse(rawResponse);
        if (Array.isArray(parsed.classifications)) {
          classifications.push(...parsed.classifications);
          usedOllama = true;
        }
        if (onProgress) {
          onProgress(Math.min(items.length, i + OLLAMA_BATCH_SIZE), items.length);
        }
      }
    } catch (err) {
      console.warn('Ollama indisponível ou demorando demais, completando com motor heurístico ultrarrápido:', err);
    }
  }

  // 2. High-precision semantic heuristic (instantaneous: processes 3,500+ items in < 100ms)
  const classifiedIds = new Set(classifications.map((c) => c.id));
  const remainingItems = items.filter((item) => !classifiedIds.has(item.id));

  if (remainingItems.length > 0) {
    const heuristicResults = remainingItems.map((item) => {
      const suggestedFolder = classifyBookmarkIntelligently(item.title || '', item.url, item.folderPath || '');
      return {
        id: item.id,
        suggestedFolder,
        suggestedTitle: item.title,
      };
    });
    classifications.push(...heuristicResults);
  }

  if (onProgress) {
    onProgress(items.length, items.length);
  }

  // 3. Assemble proposed plan
  const foldersSet = new Set<string>();
  const itemMap = new Map(items.map((i) => [i.id, i]));

  const moves = classifications
    .filter((c) => itemMap.has(c.id))
    .map((c) => {
      const item = itemMap.get(c.id)!;
      const folderName = c.suggestedFolder || 'Outros & Geral';
      foldersSet.add(folderName);
      return {
        bookmarkId: c.id,
        bookmarkTitle: c.suggestedTitle || item.title,
        url: item.url,
        targetFolder: folderName,
        targetFolderExists: existingFolderNames.has(folderName.toLowerCase()),
      };
    });

  return {
    plan: {
      suggestedFolders: Array.from(foldersSet).sort((a, b) => a.localeCompare(b)),
      moves,
    },
    usedOllama,
  };
}
