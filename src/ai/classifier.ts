import { AiBookmarkItem, AiProposedPlan, OllamaConfig, MiniAgentBookmarkContext } from './types';
import { queryOllama } from './ollama';
import { buildCategorizationPrompt } from './prompts';

export const TAXONOMY_MASTER_CATEGORIES = [
  'Arte & Design',
  'Compras',
  'Comunicação & Redes Sociais',
  'Dev & IA',
  'Eletroeletrônica',
  'Eletrônica',
  'Engenharia & Mecânica',
  'Entretenimento',
  'Espiritualidade',
  'Estudos',
  'Filmes & Séries',
  'Finanças',
  'Governo',
  'Jogos',
  'Mecânica',
  'Música',
  'Negócios & Finanças',
  'Notícias',
  'Notícias & Informação',
  'Outros',
  'Produtividade',
  'Redes Sociais',
  'Saúde & Bem-Estar',
  'Serviços & Utilidades',
  'Tecnologia',
  'Trabalho & Carreira',
  'Viagens & Turismo',
] as const;

/**
 * High precision domain dictionary mapping directly to non-redundant intelligent subfolders.
 * No "... / Geral" subfolders.
 */
export const DOMAIN_SUBFOLDER_MAP: Record<string, string> = {
  // Dev & IA
  'github.com': 'Dev & IA / Repositórios',
  'gitlab.com': 'Dev & IA / Repositórios',
  'bitbucket.org': 'Dev & IA / Repositórios',
  'sourceforge.net': 'Dev & IA / Repositórios',
  'gist.github.com': 'Dev & IA / Repositórios',
  'stackoverflow.com': 'Dev & IA / Comunidade & Dúvidas',
  'stackexchange.com': 'Dev & IA / Comunidade & Dúvidas',
  'developer.mozilla.org': 'Dev & IA / Documentação',
  'w3schools.com': 'Dev & IA / Documentação',
  'devdocs.io': 'Dev & IA / Documentação',
  'learn.microsoft.com': 'Dev & IA / Documentação',
  'docs.microsoft.com': 'Dev & IA / Documentação',
  'developer.android.com': 'Dev & IA / Documentação',
  'devmedia.com.br': 'Dev & IA / Documentação',
  'linguagemc.com.br': 'Dev & IA / Documentação',
  'visualg3.com.br': 'Dev & IA / Documentação',
  'claude.ai': 'Dev & IA / Inteligência Artificial',
  'chatgpt.com': 'Dev & IA / Inteligência Artificial',
  'openai.com': 'Dev & IA / Inteligência Artificial',
  'ollama.com': 'Dev & IA / Inteligência Artificial',
  'huggingface.co': 'Dev & IA / Inteligência Artificial',
  'perplexity.ai': 'Dev & IA / Inteligência Artificial',
  'colab.research.google.com': 'Dev & IA / Inteligência Artificial',
  'kaggle.com': 'Dev & IA / Inteligência Artificial',
  'elevenlabs.io': 'Dev & IA / Inteligência Artificial',
  'suno.com': 'Dev & IA / Inteligência Artificial',
  'suno.ai': 'Dev & IA / Inteligência Artificial',
  'deepseekv3.net': 'Dev & IA / Inteligência Artificial',
  'deepseek.com': 'Dev & IA / Inteligência Artificial',
  'anthropic.com': 'Dev & IA / Inteligência Artificial',
  'midjourney.com': 'Dev & IA / Inteligência Artificial',
  'poe.com': 'Dev & IA / Inteligência Artificial',
  'groq.com': 'Dev & IA / Inteligência Artificial',
  'cohere.com': 'Dev & IA / Inteligência Artificial',
  'mistral.ai': 'Dev & IA / Inteligência Artificial',
  'replicate.com': 'Dev & IA / Inteligência Artificial',
  'neuralwriter.com': 'Dev & IA / Inteligência Artificial',
  'quillbot.com': 'Dev & IA / Inteligência Artificial',
  'skills.sh': 'Dev & IA / Ferramentas',
  'vercel.com': 'Dev & IA / Ferramentas',
  'npmjs.com': 'Dev & IA / Ferramentas',
  'pypi.org': 'Dev & IA / Ferramentas',
  'docker.com': 'Dev & IA / Ferramentas',
  'postman.com': 'Dev & IA / Ferramentas',
  'supabase.com': 'Dev & IA / Ferramentas',
  'firebase.google.com': 'Dev & IA / Ferramentas',
  'railway.app': 'Dev & IA / Ferramentas',
  'render.com': 'Dev & IA / Ferramentas',
  'netlify.com': 'Dev & IA / Ferramentas',
  'tailwindcss.com': 'Dev & IA / Ferramentas',
  'sentry.io': 'Dev & IA / Ferramentas',
  'cloudflare.com': 'Dev & IA / Ferramentas',
  'dev.to': 'Dev & IA / Comunidade & Dúvidas',
  'hashnode.com': 'Dev & IA / Comunidade & Dúvidas',
  'healthchecks.io': 'Dev & IA / Ferramentas',
  'tidbcloud.com': 'Dev & IA / Ferramentas',
  'graphify.com': 'Dev & IA / Inteligência Artificial',
  'open-vsx.org': 'Dev & IA / Ferramentas',
  'antigravity.google': 'Dev & IA / Inteligência Artificial',
  'grok.com': 'Dev & IA / Inteligência Artificial',
  'civitai.com': 'Dev & IA / Inteligência Artificial',

  // Jogos
  'nexusmods.com': 'Jogos / Mods',
  'mixmods.com.br': 'Jogos / Mods',
  'curseforge.com': 'Jogos / Mods',
  'modrinth.com': 'Jogos / Mods',
  'mugenation.it': 'Jogos / Mods',
  'mugenguild.com': 'Jogos / Mods',
  'filterblade.xyz': 'Jogos / Mods',
  'dyndolod.info': 'Jogos / Mods',
  'rockstargames.com': 'Jogos / PC',
  'bethesda.net': 'Jogos / PC',
  'enbdev.com': 'Jogos / Mods',
  'martysmods.com': 'Jogos / Mods',
  'central-mods.com.br': 'Jogos / Mods',
  'unknowncheats.me': 'Jogos / Mods',
  'gamehacking.org': 'Jogos / Mods',
  'wabbajack.org': 'Jogos / Mods',
  'loadorderlibrary.com': 'Jogos / Mods',
  'torrentgamesps3.net': 'Jogos / PlayStation',
  'psxdownloads.us': 'Jogos / PlayStation',
  'cdromance.com': 'Jogos / PlayStation',
  'playstation.com': 'Jogos / PlayStation',
  'nintendo.com': 'Jogos / Nintendo',
  'xbox.com': 'Jogos / Xbox',
  'coolrom.com.br': 'Jogos / Emuladores & ROMs',
  'coolrom.com': 'Jogos / Emuladores & ROMs',
  'vimm.net': 'Jogos / Emuladores & ROMs',
  'retroarch.com': 'Jogos / Emuladores & ROMs',
  'ppsspp.org': 'Jogos / Emuladores & ROMs',
  'retroachievements.org': 'Jogos / Emuladores & ROMs',
  'x360ce.com': 'Jogos / Emuladores & ROMs',
  'snesforever.com.br': 'Jogos / Emuladores & ROMs',
  'poe.ninja': 'Jogos / Wikis & Guias',
  'poe2db.tw': 'Jogos / Wikis & Guias',
  'poe2builder.com': 'Jogos / Wikis & Guias',
  'craftofexile.com': 'Jogos / Wikis & Guias',
  'mobalytics.gg': 'Jogos / Wikis & Guias',
  'maxroll.gg': 'Jogos / Wikis & Guias',
  'icy-veins.com': 'Jogos / Wikis & Guias',
  'ign.com': 'Jogos / Wikis & Guias',
  'gamevicio.com': 'Jogos / Wikis & Guias',
  'aom.heavengames.com': 'Jogos / Wikis & Guias',
  'store.steampowered.com': 'Jogos / PC',
  'steamcommunity.com': 'Jogos / PC',
  'steamdb.info': 'Jogos / PC',
  'epicgames.com': 'Jogos / PC',
  'gog.com': 'Jogos / PC',
  'fitgirl-repacks.site': 'Jogos / PC',
  'pathofexile.com': 'Jogos / PC',
  'roblox.com': 'Jogos / PC',
  'ea.com': 'Jogos / PC',
  'riotgames.com': 'Jogos / PC',
  'blizzard.com': 'Jogos / PC',
  'battle.net': 'Jogos / PC',
  'itch.io': 'Jogos / PC',
  'speedrun.com': 'Jogos / Wikis & Guias',
  'fandom.com': 'Jogos / Wikis & Guias',
  'howlongtobeat.com': 'Jogos / Wikis & Guias',
  'gamefaqs.gamespot.com': 'Jogos / Wikis & Guias',
  'pcgamer.com': 'Jogos / PC',
  'twitch.tv': 'Jogos / PC',

  // Música
  'cifraclub.com.br': 'Música / Partituras & Cifras',
  'songsterr.com': 'Música / Partituras & Cifras',
  'ultimateguitar.com': 'Música / Partituras & Cifras',
  'musescore.org': 'Música / Partituras & Cifras',
  'cifradventista.com': 'Música / Hinários & CCB',
  'congregacao.org.br': 'Música / Hinários & CCB',
  'musical.congregacao.org.br': 'Música / Hinários & CCB',
  'evangelizar2017.com.br': 'Música / Hinários & CCB',
  'atelierlabussiere.com': 'Música / Instrumentos & Luthiaria',
  'atelierkamroyan.com.br': 'Música / Instrumentos & Luthiaria',
  'chordu.com': 'Música / Partituras & Cifras',
  'amar.art.br': 'Música',
  'ubc.org.br': 'Música',
  'spotify.com': 'Música / Streaming',
  'open.spotify.com': 'Música / Streaming',
  'deezer.com': 'Música / Streaming',
  'music.apple.com': 'Música / Streaming',
  'music.youtube.com': 'Música / Streaming',
  'soundcloud.com': 'Música / Streaming',
  'filarmonica.art.br': 'Música / Streaming',

  // Eletrônica
  'arduino.cc': 'Eletrônica / Microcontroladores & DIY',
  'espressif.com': 'Eletrônica / Microcontroladores & DIY',
  'raspberrypi.com': 'Eletrônica / Microcontroladores & DIY',
  'easyeda.com': 'Eletrônica / Circuitos & Esquemas',
  'kicad.org': 'Eletrônica / Circuitos & Esquemas',
  'falstad.com': 'Eletrônica / Circuitos & Esquemas',
  'fritzing.org': 'Eletrônica / Circuitos & Esquemas',
  'alldatasheet.com': 'Eletrônica / Componentes & Datasheets',
  'mouser.com': 'Eletrônica / Componentes & Datasheets',
  'mouser.com.br': 'Eletrônica / Componentes & Datasheets',
  'digikey.com': 'Eletrônica / Componentes & Datasheets',
  'digikey.com.br': 'Eletrônica / Componentes & Datasheets',
  'kostalbrasil.com.br': 'Eletrônica / Componentes & Datasheets',

  // Engenharia & Mecânica
  'solidworks.com': 'Engenharia & Mecânica / CAD & Modelagem 3D',
  'autodesk.com': 'Engenharia & Mecânica / CAD & Modelagem 3D',
  'grabcad.com': 'Engenharia & Mecânica / CAD & Modelagem 3D',
  'thingiverse.com': 'Engenharia & Mecânica / CAD & Modelagem 3D',
  'printables.com': 'Engenharia & Mecânica / CAD & Modelagem 3D',
  'lojadomecanico.com.br': 'Engenharia & Mecânica / Usinagem & Ferramentas',
  'mundomanuais.com': 'Engenharia & Mecânica / Usinagem & Ferramentas',
  'bamaqmaquinas.com.br': 'Engenharia & Mecânica / Usinagem & Ferramentas',
  'retroescavadeiras.net': 'Engenharia & Mecânica / Usinagem & Ferramentas',
  'argalit.com.br': 'Engenharia & Mecânica / Usinagem & Ferramentas',
  'gessopadrao.com.br': 'Engenharia & Mecânica / Usinagem & Ferramentas',
  'autopapo.uol.com.br': 'Engenharia & Mecânica / Automotivo',
  'blogiveco.com.br': 'Engenharia & Mecânica / Automotivo',
  'volvotrucks.com.br': 'Engenharia & Mecânica / Automotivo',
  'chiptronic.com.br': 'Engenharia & Mecânica / Automotivo',
  'doutorie.com.br': 'Engenharia & Mecânica / Automotivo',
  'motosblog.com.br': 'Engenharia & Mecânica / Automotivo',
  'latinncap.com': 'Engenharia & Mecânica / Automotivo',
  'totalenergies.com.br': 'Engenharia & Mecânica / Automotivo',
  'ultimatespecs.com': 'Engenharia & Mecânica / Automotivo',
  'mhhauto.com': 'Engenharia & Mecânica / Automotivo',
  'repxpert.com.br': 'Engenharia & Mecânica / Automotivo',
  'canaldapeca.com.br': 'Engenharia & Mecânica / Automotivo',
  'carrosnaweb.com.br': 'Engenharia & Mecânica / Automotivo',
  'busclub.com.br': 'Engenharia & Mecânica / Automotivo',
  'nemigaparts.com': 'Engenharia & Mecânica / Automotivo',
  'stefanelli.eng.br': 'Engenharia & Mecânica',
  'site.vistoriapro.com.br': 'Engenharia & Mecânica / Inspeção & Manutenção',
  'arenatecnica.com': 'Engenharia & Mecânica / Inspeção & Manutenção',
  'engeteles.com.br': 'Engenharia & Mecânica / Inspeção & Manutenção',

  // Tecnologia
  'xdaforums.com': 'Tecnologia / Android',
  'tudocelular.com': 'Tecnologia / Android',
  'apkpure.com': 'Tecnologia / Android',
  'm.apkpure.com': 'Tecnologia / Android',
  'rexdl.com': 'Tecnologia / Android',
  'nextpit.com.br': 'Tecnologia / Android',
  'bstweaker.tk': 'Tecnologia / Android',
  'clubedohardware.com.br': 'Tecnologia / Hardware',
  'hardware.com.br': 'Tecnologia / Hardware',
  'hwinfo.com': 'Tecnologia / Hardware',
  'egpu.io': 'Tecnologia / Hardware',
  'bbbaterias.com.br': 'Tecnologia / Hardware',
  'techspot.com': 'Tecnologia / Hardware',
  'cpuid.com': 'Tecnologia / Hardware',
  'coderbag.com': 'Tecnologia / Windows & Sistemas',
  'tailscale.com': 'Tecnologia / Redes & Segurança',
  'zerotier.com': 'Tecnologia / Redes & Segurança',
  'virustotal.com': 'Tecnologia / Redes & Segurança',
  'hybrid-analysis.com': 'Tecnologia / Redes & Segurança',
  'any.run': 'Tecnologia / Redes & Segurança',

  // Estudos
  'qconcursos.com': 'Estudos / Concursos & Cursos',
  'portaleduca.com.br': 'Estudos / Concursos & Cursos',
  'sestsenat.org.br': 'Estudos / Concursos & Cursos',
  'editalconcursosbrasil.com.br': 'Estudos / Concursos & Cursos',
  'guiadoestudante.abril.com.br': 'Estudos / Concursos & Cursos',
  'monsterconcursos.com.br': 'Estudos / Concursos & Cursos',
  'scribd.com': 'Estudos / Livros & Artigos',
  'pdfcoffee.com': 'Estudos / Livros & Artigos',
  'archive.org': 'Estudos / Livros & Artigos',
  'books.google.com.br': 'Estudos / Livros & Artigos',
  'plataforma.bvirtual.com.br': 'Estudos / Livros & Artigos',
  'doceru.com': 'Estudos / Livros & Artigos',
  'passeidireto.com': 'Estudos / Livros & Artigos',
  'uninter.com': 'Estudos / Faculdades & EAD',
  'ead.senac.br': 'Estudos / Faculdades & EAD',
  'portaldoaluno.fatecie.edu.br': 'Estudos / Faculdades & EAD',
  'tecnicoporcompetencia.com.br': 'Estudos / Faculdades & EAD',
  'certificacaoporcompetencia.com.br': 'Estudos / Faculdades & EAD',
  'socrative.com': 'Estudos / Faculdades & EAD',
  'cefetmg.br': 'Estudos / Faculdades & EAD',
  'colaboraread.com.br': 'Estudos / Faculdades & EAD',
  'scilab.org': 'Estudos / Ciências Exatas',
  'maxima.sourceforge.io': 'Estudos / Ciências Exatas',
  'mathworks.com': 'Estudos / Ciências Exatas',
  'geogebra.org': 'Estudos / Ciências Exatas',
  'oba.org.br': 'Estudos / Ciências Exatas',
  'porcentagem.org': 'Estudos / Ciências Exatas',
  'todamateria.com.br': 'Estudos / Ciências Exatas',
  'brainly.com.br': 'Estudos / Ciências Exatas',
  'canaldoensino.com.br': 'Estudos / Livros & Artigos',
  'cblservicos.org.br': 'Estudos / Livros & Artigos',
  'bdtd.uerj.br': 'Estudos / Livros & Artigos',
  'more.ufsc.br': 'Estudos / Livros & Artigos',
  'acrobatiq.com': 'Estudos / Faculdades & EAD',
  'alunodigital.anhanguera.com': 'Estudos / Faculdades & EAD',
  'copeve.cefetmg.br': 'Estudos / Concursos & Cursos',
  'scholar.google.com': 'Estudos / Livros & Artigos',
  'scholar.google.com.br': 'Estudos / Livros & Artigos',
  'scielo.br': 'Estudos / Livros & Artigos',
  'coursera.org': 'Estudos / Concursos & Cursos',
  'udemy.com': 'Estudos / Concursos & Cursos',
  'alura.com.br': 'Estudos / Concursos & Cursos',
  'dio.me': 'Estudos / Concursos & Cursos',
  'rocketseat.com.br': 'Estudos / Concursos & Cursos',
  'khanacademy.org': 'Estudos / Concursos & Cursos',
  'duolingo.com': 'Estudos / Idiomas',
  'granconcursos.com.br': 'Estudos / Concursos & Cursos',
  'estrategiaconcursos.com.br': 'Estudos / Concursos & Cursos',
  'wikipedia.org': 'Estudos / Livros & Artigos',
  'pt.wikipedia.org': 'Estudos / Livros & Artigos',
  'en.wikipedia.org': 'Estudos / Livros & Artigos',
  'researchgate.net': 'Estudos / Livros & Artigos',
  'arxiv.org': 'Estudos / Livros & Artigos',
  'conjugacao.com.br': 'Estudos / Idiomas',
  'pronounce.com': 'Estudos / Idiomas',
  'jointoucan.com': 'Estudos / Idiomas',
  'pensador.com': 'Estudos / Ciências Humanas',

  // Saúde & Bem-Estar
  'tuasaude.com': 'Saúde & Bem-Estar / Medicina & Cuidados',
  'boaconsulta.com': 'Saúde & Bem-Estar / Medicina & Cuidados',
  'minhavida.com.br': 'Saúde & Bem-Estar / Medicina & Cuidados',
  'biotreino.com.br': 'Saúde & Bem-Estar / Treino & Fitness',
  'sportllux.com.br': 'Saúde & Bem-Estar / Treino & Fitness',
  'mundoboaforma.com.br': 'Saúde & Bem-Estar / Nutrição & Suplementos',
  'dicasdemulher.com.br': 'Saúde & Bem-Estar / Nutrição & Suplementos',
  'ciclovivo.com.br': 'Saúde & Bem-Estar',
  'lojarelvaverde.com.br': 'Saúde & Bem-Estar / Nutrição & Suplementos',
  'hapvida.com.br': 'Saúde & Bem-Estar / Medicina & Cuidados',
  'doctorfeet.com.br': 'Saúde & Bem-Estar / Medicina & Cuidados',
  'farmaciaeficacia.com.br': 'Saúde & Bem-Estar / Medicina & Cuidados',
  'gsuplementos.com.br': 'Saúde & Bem-Estar / Nutrição & Suplementos',
  'natusvita.com.br': 'Saúde & Bem-Estar / Nutrição & Suplementos',
  'mutantnation.com': 'Saúde & Bem-Estar / Nutrição & Suplementos',
  'bodynutry.ind.br': 'Saúde & Bem-Estar / Nutrição & Suplementos',
  'ativo.com': 'Saúde & Bem-Estar / Treino & Fitness',
  'decathlon.com.br': 'Saúde & Bem-Estar / Treino & Fitness',
  'treinus.com.br': 'Saúde & Bem-Estar / Treino & Fitness',
  'nhlbi.nih.gov': 'Saúde & Bem-Estar / Medicina & Cuidados',
  'veganize.com.br': 'Saúde & Bem-Estar / Nutrição & Suplementos',
  'cantinhovegetariano.com.br': 'Saúde & Bem-Estar / Nutrição & Suplementos',
  'tempodecozimento.com.br': 'Saúde & Bem-Estar / Nutrição & Suplementos',

  // Negócios & Finanças
  'itau.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'correspondenciasdigitais.itau.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'paypal.com': 'Negócios & Finanças / Investimentos & Bancos',
  'mercadopago.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'nubank.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'bradesco.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'santander.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'inter.co': 'Negócios & Finanças / Investimentos & Bancos',
  'c6bank.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'bb.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'caixa.gov.br': 'Negócios & Finanças / Investimentos & Bancos',
  'xpi.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'btgpactual.com': 'Negócios & Finanças / Investimentos & Bancos',
  'clear.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'rico.com.vc': 'Negócios & Finanças / Investimentos & Bancos',
  'picpay.com': 'Negócios & Finanças / Investimentos & Bancos',
  'pagbank.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'coinmarketcap.com': 'Negócios & Finanças / Investimentos & Bancos',
  'binance.com': 'Negócios & Finanças / Investimentos & Bancos',
  'tradingview.com': 'Negócios & Finanças / Investimentos & Bancos',
  'mepoupe.com': 'Negócios & Finanças / Investimentos & Bancos',
  'idinheiro.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'guardardinheiro.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'statusinvest.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'fundamentus.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'infomoney.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'b3.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'serasaconsumidor.com.br': 'Negócios & Finanças / Investimentos & Bancos',
  'sebrae.com.br': 'Negócios & Finanças / Empreendedorismo & Marcas',
  'contabilizei.com.br': 'Negócios & Finanças / Empreendedorismo & Marcas',
  'agendor.com.br': 'Negócios & Finanças / Vendas & Gestão',
  'consolidesuamarca.com.br': 'Negócios & Finanças / Empreendedorismo & Marcas',
  'registrodemarca.arenamarcas.com.br': 'Negócios & Finanças / Empreendedorismo & Marcas',
  'trademark-search.marcaria.com': 'Negócios & Finanças / Empreendedorismo & Marcas',
  'regify.global': 'Negócios & Finanças / Empreendedorismo & Marcas',
  'jobboard.universia.net': 'Negócios & Finanças / Vagas & Carreira',
  'vale.com': 'Negócios & Finanças / Vagas & Carreira',
  'careers.abb': 'Negócios & Finanças / Vagas & Carreira',
  'escolatrabalhador4.sharepoint.com': 'Negócios & Finanças / Vagas & Carreira',

  // Espiritualidade
  'amorc.org.br': 'Espiritualidade / Filosofia & Misticismo',
  'guiadaalma.com.br': 'Espiritualidade / Filosofia & Misticismo',
  'eusemfronteiras.com.br': 'Espiritualidade / Filosofia & Misticismo',
  'astrolink.com.br': 'Espiritualidade / Astrologia & Numerologia',
  'viastral.com.br': 'Espiritualidade / Astrologia & Numerologia',
  'personare.com.br': 'Espiritualidade / Astrologia & Numerologia',
  'gematrialens.com': 'Espiritualidade / Astrologia & Numerologia',
  'gematriacalculator.org': 'Espiritualidade / Astrologia & Numerologia',
  'pathnumbers.com': 'Espiritualidade / Astrologia & Numerologia',
  'cosmosdaily.co': 'Espiritualidade / Astrologia & Numerologia',
  'abrame.org.br': 'Espiritualidade / Bíblia & Teologia',
  'apologeticavii.wordpress.com': 'Espiritualidade / Bíblia & Teologia',
  'febnet.org.br': 'Espiritualidade / Filosofia & Misticismo',
  'ordoaa.com.br': 'Espiritualidade / Filosofia & Misticismo',
  'dicionariodesimbolos.com.br': 'Espiritualidade / Filosofia & Misticismo',

  // Governo
  'detran.mg.gov.br': 'Governo / Trânsito & Detran',
  'detran.sp.gov.br': 'Governo / Trânsito & Detran',
  'detran.rj.gov.br': 'Governo / Trânsito & Detran',
  'seguradoralider.com.br': 'Governo / Trânsito & Detran',
  'cft.org.br': 'Governo / Serviços Públicos',
  'gov.br': 'Governo / Serviços Públicos',
  'planalto.gov.br': 'Governo / Serviços Públicos',
  'receita.fazenda.gov.br': 'Governo / Serviços Públicos',
  'inss.gov.br': 'Governo / Serviços Públicos',
  'tse.jus.br': 'Governo / Serviços Públicos',
  'vakinha.com.br': 'Governo / Serviços Públicos',
  'naomeperturbe.com.br': 'Governo / Serviços Públicos',
  'dni-br.com': 'Governo / Serviços Públicos',
  'jusbrasil.com.br': 'Governo / Serviços Públicos',

  // Filmes & Séries
  'crunchyroll.com': 'Filmes & Séries / Animes',
  'saikoani.me': 'Filmes & Séries / Animes',
  'animeq.blog': 'Filmes & Séries / Animes',
  'adorocinema.com': 'Filmes & Séries',
  'revistabula.com': 'Filmes & Séries',
  'legiaodosherois.com.br': 'Filmes & Séries / Animações & HQs',
  'netflix.com': 'Filmes & Séries / Streaming',
  'primevideo.com': 'Filmes & Séries / Streaming',
  'disneyplus.com': 'Filmes & Séries / Streaming',
  'max.com': 'Filmes & Séries / Streaming',
  'hbomax.com': 'Filmes & Séries / Streaming',
  'imdb.com': 'Filmes & Séries / Streaming',
  'letterboxd.com': 'Filmes & Séries / Streaming',
  'youtube.com': 'Filmes & Séries / Streaming',
  'starplus.com': 'Filmes & Séries / Streaming',
  'stremio-addons.com': 'Filmes & Séries / Streaming',
  'jellyfin.org': 'Filmes & Séries / Streaming',
  'app.plex.tv': 'Filmes & Séries / Streaming',
  'dailymotion.com': 'Filmes & Séries / Streaming',
  'bludv.tv': 'Filmes & Séries / Torrents & Downloads',
  'bludvfilmes.com': 'Filmes & Séries / Torrents & Downloads',
  'comandotorrents.to': 'Filmes & Séries / Torrents & Downloads',
  'ondebaixa.com': 'Filmes & Séries / Torrents & Downloads',
  'reidostorrents.com': 'Filmes & Séries / Torrents & Downloads',
  'torrentclaw.com': 'Filmes & Séries / Torrents & Downloads',

  // Arte & Design
  'custom-cursor.com': 'Arte & Design / Wallpapers & Ícones',
  'icon-icons.com': 'Arte & Design / Wallpapers & Ícones',
  'getwallpapers.com': 'Arte & Design / Wallpapers & Ícones',
  'wallhaven.cc': 'Arte & Design / Wallpapers & Ícones',
  'alphacoders.com': 'Arte & Design / Wallpapers & Ícones',
  'visualskins.com': 'Arte & Design / Wallpapers & Ícones',
  'canva.com': 'Arte & Design / Modelagem 3D & Design',
  'figma.com': 'Arte & Design / Modelagem 3D & Design',
  'free3d.com': 'Arte & Design / Modelagem 3D & Design',
  'artvee.com': 'Arte & Design',
  'create.vista.com': 'Arte & Design',
  'floorplanner.com': 'Arte & Design / Arquitetura & Construção',
  'useum.org': 'Arte & Design',

  // Compras
  'menshairstylestoday.com': 'Compras / Moda & Vestuário',
  'manualdohomemmoderno.com.br': 'Compras / Moda & Vestuário',
  'relogiosbrpremium.com': 'Compras / Moda & Vestuário',
  'br.puma.com': 'Compras / Moda & Vestuário',
  'rider.com.br': 'Compras / Moda & Vestuário',
  'belezanaweb.com.br': 'Compras / Perfumaria',
  'lojabrmetaverso.com.br': 'Compras / Hardware & Informática',
  'cofermeta.com.br': 'Compras / Hardware & Informática',
  'kabum.com.br': 'Compras / Hardware & Informática',
  'pichau.com.br': 'Compras / Hardware & Informática',
  'terabyteshop.com.br': 'Compras / Hardware & Informática',
  'pelando.com.br': 'Compras / Cupons & Comparadores',
  'promobit.com.br': 'Compras / Cupons & Comparadores',
  'zoom.com.br': 'Compras / Cupons & Comparadores',
  'buscape.com.br': 'Compras / Cupons & Comparadores',
  'mercadolivre.com.br': 'Compras / Marketplaces',
  'amazon.com.br': 'Compras / Marketplaces',
  'shopee.com.br': 'Compras / Marketplaces',
  'aliexpress.com': 'Compras / Marketplaces',
  'magazineluiza.com.br': 'Compras / Marketplaces',
  'shein.com': 'Compras / Marketplaces',
  'olx.com.br': 'Compras / Marketplaces',
  'casasbahia.com.br': 'Compras / Marketplaces',
  'netshoes.com.br': 'Compras / Marketplaces',

  // Produtividade
  'addoncrop.com': 'Produtividade / Extensões & Ferramentas',
  'rewards.bing.com': 'Produtividade / Recompensas & Pontos',
  'docusign.com': 'Produtividade / Nuvem & Arquivos',
  'obsproject.com': 'Produtividade / Gravação & Edição',
  'checklistfacil.com.br': 'Produtividade / Nuvem & Arquivos',
  'ilovepdf.com': 'Produtividade / Nuvem & Arquivos',
  'iloveimg.com': 'Produtividade / Nuvem & Arquivos',
  'smallpdf.com': 'Produtividade / Nuvem & Arquivos',
  'mega.nz': 'Produtividade / Nuvem & Arquivos',
  'drive.google.com': 'Produtividade / Nuvem & Arquivos',
  'docs.google.com': 'Produtividade / Nuvem & Arquivos',
  'notion.so': 'Produtividade / Nuvem & Arquivos',
  'trello.com': 'Produtividade / Nuvem & Arquivos',
  'asana.com': 'Produtividade / Nuvem & Arquivos',
  'linear.app': 'Produtividade / Nuvem & Arquivos',
  'miro.com': 'Produtividade / Nuvem & Arquivos',
  'keep.google.com': 'Produtividade / Nuvem & Arquivos',
  'speedtest.net': 'Produtividade / Nuvem & Arquivos',
  'fast.com': 'Produtividade / Nuvem & Arquivos',
  'bitly.com': 'Produtividade / Nuvem & Arquivos',
  'tinyurl.com': 'Produtividade / Nuvem & Arquivos',
  'drivedepobre.com': 'Produtividade / Nuvem & Arquivos',
  'miniwebtool.com': 'Produtividade / Nuvem & Arquivos',
  'typeform.com': 'Produtividade / Nuvem & Arquivos',
  '4devs.com.br': 'Produtividade / Nuvem & Arquivos',

  // Viagens & Turismo
  'booking.com': 'Viagens & Turismo',
  'airbnb.com.br': 'Viagens & Turismo',
  'decolar.com': 'Viagens & Turismo',
  'skyscanner.com.br': 'Viagens & Turismo',
  'tripadvisor.com.br': 'Viagens & Turismo',
  'tripadvisor.com': 'Viagens & Turismo',
  'apureguria.com': 'Viagens & Turismo',
  'destinosnotaveis.com.br': 'Viagens & Turismo',
  'rotadasemocoesbrasil.com.br': 'Viagens & Turismo',
  'latamairlines.com': 'Viagens & Turismo',
  'voegol.com.br': 'Viagens & Turismo',
  'voeazul.com.br': 'Viagens & Turismo',
  'hoteis.com': 'Viagens & Turismo',
  'trivago.com.br': 'Viagens & Turismo',
  'cvc.com.br': 'Viagens & Turismo',
  'rentalcars.com': 'Viagens & Turismo',
  'eventim.com.br': 'Viagens & Turismo',
  'expominasbh.com.br': 'Viagens & Turismo',

  // Redes Sociais
  'web.whatsapp.com': 'Redes Sociais',
  'web.telegram.org': 'Redes Sociais',
  'x.com': 'Redes Sociais',
  'twitter.com': 'Redes Sociais',
  'facebook.com': 'Redes Sociais',
  'tiktok.com': 'Redes Sociais',
  'threads.net': 'Redes Sociais',
  'bsky.app': 'Redes Sociais',
  'pinterest.com': 'Redes Sociais',
  'reddit.com': 'Redes Sociais',
  'linkedin.com': 'Redes Sociais',
  'discord.com': 'Redes Sociais',
  'instagram.com': 'Redes Sociais',
  'linktr.ee': 'Redes Sociais',
  'mail.google.com': 'Redes Sociais',

  // Notícias & Atualidades
  'g1.globo.com': 'Notícias',
  'uol.com.br': 'Notícias',
  'folha.uol.com.br': 'Notícias',
  'estadao.com.br': 'Notícias',
  'cnnbrasil.com.br': 'Notícias',
  'bbc.com': 'Notícias',
  'metropoles.com': 'Notícias',
  'techtudo.com.br': 'Tecnologia',
  'canaltech.com.br': 'Tecnologia',
  'olhardigital.com.br': 'Tecnologia',
  'adrenaline.com.br': 'Tecnologia / Hardware',
};

/**
 * Extracts and normalizes search queries and clean context from URLs and titles.
 */
export function cleanUrlAndExtractContext(
  url: string,
  title: string,
  folderContext: string = ''
): { fullText: string; domain: string } {
  let extraText = '';
  let domain = '';

  const cleanTitle = (title || '')
    .replace(/^\(\d+\)\s*/, '')
    .replace(/\s*-\s*YouTube$/i, '')
    .replace(/\s*–\s*Wikipédia.*$/i, '')
    .replace(/\s*-\s*Pesquisa Google$/i, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  try {
    const u = new URL(url);
    domain = u.hostname.replace(/^www\./, '').toLowerCase();

    try {
      if (u.search) {
        extraText += ' ' + decodeURIComponent(u.search.replace(/\+/g, ' '));
      }
      if (u.pathname) {
        extraText += ' ' + decodeURIComponent(u.pathname.replace(/[\/\-_.]+/g, ' '));
      }
    } catch {
      extraText += ' ' + u.search + ' ' + u.pathname;
    }

    if (domain.includes('google.') && u.pathname.startsWith('/amp/s/')) {
      const realPath = u.pathname.replace('/amp/s/', '');
      extraText += ' ' + realPath.split('/').join(' ');
    }

    if (u.searchParams.has('q')) extraText += ' ' + u.searchParams.get('q');
    if (u.searchParams.has('oq')) extraText += ' ' + u.searchParams.get('oq');
    if (u.searchParams.has('query')) extraText += ' ' + u.searchParams.get('query');
    if (u.searchParams.has('search')) extraText += ' ' + u.searchParams.get('search');
    if (u.searchParams.has('search_query')) extraText += ' ' + u.searchParams.get('search_query');
  } catch {}

  if (folderContext) {
    const cleanFolderContext = folderContext
      .replace(/barra de favoritos/gi, '')
      .replace(/outros favoritos/gi, '')
      .replace(/bookmarks bar/gi, '')
      .replace(/other bookmarks/gi, '')
      .replace(/favoritos m[oó]veis/gi, '')
      .trim();
    if (cleanFolderContext && cleanTitle.trim().length < 25) {
      extraText += ' ' + cleanFolderContext.replace(/[\/\-_.]+/g, ' ');
    }
  }

  const fullText = `${cleanTitle} ${domain} ${extraText}`.toLowerCase();
  return { fullText, domain };
}

/**
 * Capitalizes every single word in a folder or subfolder path (Title Case),
 * preserving special technical acronyms and abbreviations (IA, AI, PC, 3D, CAD, ROMs, etc.).
 */
export function capitalizeFolderWords(folderPath: string): string {
  if (!folderPath || typeof folderPath !== 'string') return 'Outros';

  const PRESERVED_ACRONYMS = new Set([
    'IA', 'AI', 'PC', 'ROM', 'ROMS', '3D', 'CAD', 'CAM', 'DIY', 'CCB', 'API', 'SDK', 'UI', 'UX',
    'SSD', 'HD', 'DNS', 'IP', 'URL', 'PDF', 'EAD', 'HQ', 'HQS', 'TI', 'MEI', 'CNPJ', 'INSS', 'IPVA',
    'CNH', 'B3', 'ABNT', 'SENAI', 'SENAC', 'MEC', 'ENEM', 'FUVEST', 'G1', 'UOL', 'CNN', 'BBC'
  ]);

  const SPECIAL_MAP: Record<string, string> = {
    'ia': 'IA',
    'ai': 'AI',
    'pc': 'PC',
    'rom': 'ROM',
    'roms': 'ROMs',
    '3d': '3D',
    'cad': 'CAD',
    'cam': 'CAM',
    'diy': 'DIY',
    'ccb': 'CCB',
    'api': 'API',
    'sdk': 'SDK',
    'ui': 'UI',
    'ux': 'UX',
    'ead': 'EAD',
    'hq': 'HQ',
    'hqs': 'HQs',
    'ti': 'TI',
    'mei': 'MEI',
    'cnpj': 'CNPJ',
    'inss': 'INSS',
    'ipva': 'IPVA',
    'cnh': 'CNH',
    'detran': 'Detran',
    'b3': 'B3',
    'abnt': 'ABNT',
    'senai': 'SENAI',
    'senac': 'SENAC',
    'mec': 'MEC',
    'enem': 'ENEM',
    'fuvest': 'FUVEST',
    'g1': 'G1',
    'uol': 'UOL',
    'cnn': 'CNN',
    'bbc': 'BBC',
    'playstation': 'PlayStation',
    'ps1': 'PS1',
    'ps2': 'PS2',
    'ps3': 'PS3',
    'ps4': 'PS4',
    'ps5': 'PS5',
    'xbox': 'Xbox',
    'nintendo': 'Nintendo',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'bitbucket': 'Bitbucket',
    'vscode': 'VS Code',
    'android': 'Android',
    'windows': 'Windows',
    'whatsapp': 'WhatsApp',
    'youtube': 'YouTube',
    'linkedin': 'LinkedIn',
    'tiktok': 'TikTok',
    'netflix': 'Netflix',
    'disney+': 'Disney+',
  };

  const segments = folderPath.split(/\s*\/\s*/).map((segment) => {
    return segment
      .split(/(\s+|&|-|\+)/)
      .map((part) => {
        if (!part || /^\s+$/.test(part) || part === '&' || part === '-' || part === '+') {
          return part;
        }
        const lower = part.toLowerCase();
        if (SPECIAL_MAP[lower]) {
          return SPECIAL_MAP[lower];
        }
        if (PRESERVED_ACRONYMS.has(part.toUpperCase())) {
          return part.toUpperCase();
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join('');
  });

  return segments.filter(Boolean).join(' / ');
}

/**
 * Validates, normalizes, and sanitizes folder paths returned by AI models or heuristic rules.
 * Eliminates redundant legacy category names, converts "/ Geral" into master folder,
 * and ensures all words are Title Cased.
 */
export const MASTER_REDUNDANT_SUBFOLDERS: Record<string, Set<string>> = {
  'Jogos': new Set(['games', 'jogos', 'gaming', 'jogo', 'geral', '(geral)']),
  'Governo': new Set(['governo', 'cidadania', 'gov', 'governo & cidadania', 'governo e cidadania', 'geral', '(geral)']),
  'Filmes & Séries': new Set(['filmes', 'series', 'séries', 'filmes & séries', 'filmes e séries', 'cinema', 'filme', 'série', 'geral', '(geral)']),
  'Compras': new Set(['lojas', 'compras', 'loja', 'compra', 'shopping', 'lojas & compras', 'lojas e compras', 'geral', '(geral)']),
  'Estudos': new Set(['educação', 'educacao', 'estudos', 'estudo', 'estudos & educação', 'estudos e educação', 'geral', '(geral)']),
  'Música': new Set(['músicas', 'musicas', 'música', 'musica', 'som', 'geral', '(geral)']),
  'Tecnologia': new Set(['informática', 'informatica', 'tecnologia', 'tech', 'ti', 'tecnologia & informática', 'geral', '(geral)']),
  'Saúde & Bem-Estar': new Set(['saúde', 'saude', 'bem-estar', 'fitness', 'saúde & fitness', 'geral', '(geral)']),
  'Negócios & Finanças': new Set(['finanças', 'financas', 'negócios', 'negocios', 'negócios & carreira', 'geral', '(geral)']),
  'Arte & Design': new Set(['arte', 'design', 'artes', 'arte & design', 'geral', '(geral)']),
  'Viagens & Turismo': new Set(['viagens', 'turismo', 'viagem', 'turismo, viagens & eventos', 'geral', '(geral)']),
  'Redes Sociais': new Set(['redes sociais', 'sociais', 'social', 'redes', 'redes sociais & comunicação', 'geral', '(geral)']),
  'Eletrônica': new Set(['eletrônica', 'eletronica', 'elétrica', 'eletrica', 'eletroeletrônica', 'geral', '(geral)']),
  'Engenharia & Mecânica': new Set(['mecânica', 'mecanica', 'engenharia', 'mecânica & engenharia', 'geral', '(geral)']),
  'Dev & IA': new Set(['dev', 'programação', 'programacao', 'desenvolvimento', 'dev & ia', 'geral', '(geral)']),
  'Espiritualidade': new Set(['espiritualidade', 'religião', 'religiao', 'espiritualidade & religião', 'geral', '(geral)']),
  'Notícias': new Set(['notícias', 'noticias', 'notícias & atualidades', 'geral', '(geral)']),
  'Produtividade': new Set(['produtividade', 'utilitários', 'produtividade & ferramentas', 'geral', '(geral)']),
  'Outros': new Set(['outros', 'geral', '(geral)', 'diversos', 'outros & geral']),
  'Mecânica': new Set(['mecânica', 'mecanica', 'engenharia', 'geral', '(geral)']),
  'Eletroeletrônica': new Set(['eletroeletrônica', 'eletroeletronica', 'eletrônica', 'eletronica', 'elétrica', 'geral', '(geral)']),
  'Serviços & Utilidades': new Set(['serviços', 'servicos', 'utilidades', 'geral', '(geral)']),
  'Comunicação & Redes Sociais': new Set(['comunicação', 'comunicacao', 'redes sociais', 'sociais', 'geral', '(geral)']),
  'Notícias & Informação': new Set(['notícias', 'noticias', 'informação', 'informacao', 'geral', '(geral)']),
  'Trabalho & Carreira': new Set(['trabalho', 'carreira', 'vagas', 'geral', '(geral)']),
  'Finanças': new Set(['finanças', 'financas', 'bancos', 'geral', '(geral)']),
  'Entretenimento': new Set(['entretenimento', 'geral', '(geral)']),
};

/**
 * Validates, normalizes, and sanitizes folder paths returned by AI models or heuristic rules.
 * Eliminates redundant legacy category names, converts "/ Geral" into master folder,
 * prevents repeated subfolders (e.g. "Animes / Animes", "Jogos / Games"),
 * and ensures all words are Title Cased.
 */
export function validateAndSanitizeFolder(rawFolder: string): string {
  if (!rawFolder || typeof rawFolder !== 'string') return 'Outros';

  let cleaned = rawFolder
    .replace(/[`"*#]/g, '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .trim();

  let parts = cleaned.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return 'Outros';

  // Strip system root folder prefixes if multiple parts exist
  const SYSTEM_ROOT_NAMES = new Set([
    'barra de favoritos',
    'outros favoritos',
    'favoritos móveis',
    'favoritos moveis',
    'bookmarks bar',
    'other bookmarks',
    'mobile bookmarks',
    'bookmarks toolbar',
  ]);
  while (parts.length > 1 && SYSTEM_ROOT_NAMES.has(parts[0].toLowerCase())) {
    parts.shift();
  }

  // Canonical normalization map to eliminate legacy or redundant names
  const CANONICAL_MASTER_MAP: Record<string, string> = {
    'jogos & games': 'Jogos',
    'jogos e games': 'Jogos',
    'games': 'Jogos',
    'governo & cidadania': 'Governo',
    'governo e cidadania': 'Governo',
    'cidadania': 'Governo',
    'programação, dev & ia': 'Dev & IA',
    'programacao, dev & ia': 'Dev & IA',
    'programação & dev': 'Dev & IA',
    'programacao': 'Dev & IA',
    'programação': 'Dev & IA',
    'estudos & educação': 'Estudos',
    'estudos e educação': 'Estudos',
    'educação': 'Estudos',
    'educacao': 'Estudos',
    'lojas & compras': 'Compras',
    'lojas e compras': 'Compras',
    'compras & lojas': 'Compras',
    'tecnologia & informática': 'Tecnologia',
    'tecnologia e informática': 'Tecnologia',
    'informática': 'Tecnologia',
    'informatica': 'Tecnologia',
    'saúde, fitness & bem-estar': 'Saúde & Bem-Estar',
    'saude, fitness e bem estar': 'Saúde & Bem-Estar',
    'saúde & fitness': 'Saúde & Bem-Estar',
    'negócios & carreira': 'Negócios & Finanças',
    'negocios & carreira': 'Negócios & Finanças',
    'finanças & negócios': 'Negócios & Finanças',
    'filmes, séries & animes': 'Filmes & Séries',
    'filmes e séries': 'Filmes & Séries',
    'arte, design & personalização': 'Arte & Design',
    'arte e design': 'Arte & Design',
    'notícias & atualidades': 'Notícias',
    'noticias & atualidades': 'Notícias',
    'produtividade & ferramentas': 'Produtividade',
    'produtividade e ferramentas': 'Produtividade',
    'redes sociais & comunicação': 'Redes Sociais',
    'redes sociais e comunicação': 'Redes Sociais',
    'turismo, viagens & eventos': 'Viagens & Turismo',
    'viagens, turismo & eventos': 'Viagens & Turismo',
    'viagens': 'Viagens & Turismo',
    'turismo': 'Viagens & Turismo',
    'eletroeletrônica': 'Eletrônica',
    'eletroeletronica': 'Eletrônica',
    'mecânica & engenharia': 'Engenharia & Mecânica',
    'mecanica & engenharia': 'Engenharia & Mecânica',
    'espiritualidade & religião': 'Espiritualidade',
    'espiritualidade e religião': 'Espiritualidade',
    'outros & geral': 'Outros',
    'outros e geral': 'Outros',
    'ferramentas': 'Produtividade',
    'estilo & moda': 'Compras',
    'moda & estilo': 'Compras',
    'moda': 'Compras',
    'estilo': 'Compras',
  };

  const rawMaster = parts[0].toLowerCase();
  let master = CANONICAL_MASTER_MAP[rawMaster] || parts[0];
  let subparts = parts.slice(1);

  // Special case: "Animes" as top-level folder becomes "Filmes & Séries / Animes"
  if (rawMaster === 'animes' || rawMaster === 'anime') {
    master = 'Filmes & Séries';
    subparts = ['Animes', ...subparts.filter((p) => p.toLowerCase() !== 'animes' && p.toLowerCase() !== 'anime')];
  }

  // Special case: "Serviços Públicos" as top-level folder becomes "Governo / Serviços Públicos"
  if (rawMaster === 'serviços públicos' || rawMaster === 'servicos publicos') {
    master = 'Governo';
    subparts = [
      'Serviços Públicos',
      ...subparts.filter(
        (p) => p.toLowerCase() !== 'serviços públicos' && p.toLowerCase() !== 'servicos publicos'
      ),
    ];
  }

  // Filter out redundant, duplicate, or synonym subfolder parts
  const redundantSet = MASTER_REDUNDANT_SUBFOLDERS[master];
  const cleanedSubparts: string[] = [];
  const seenParts = new Set<string>([master.toLowerCase()]);

  for (const part of subparts) {
    const pLower = part.toLowerCase().trim();
    if (!pLower || pLower === 'geral' || pLower === '(geral)') continue;
    if (seenParts.has(pLower)) continue;
    if (redundantSet && redundantSet.has(pLower)) continue;

    cleanedSubparts.push(part);
    seenParts.add(pLower);
  }

  const result = cleanedSubparts.length > 0
    ? `${master} / ${cleanedSubparts.join(' / ')}`
    : master;

  return capitalizeFolderWords(result);
}

/**
 * Matches a suggested folder with the user's existing folder names to prevent
 * recreating renamed or customized folders, while strictly preventing adoption of
 * legacy redundant names (e.g. keeps "Viagens & Turismo" clean, without reverting to "turismo, viagens & eventos").
 */
export function matchWithExistingFolders(
  suggestedFolder: string,
  existingFolderNames: Set<string>
): string {
  if (!existingFolderNames || existingFolderNames.size === 0) {
    return capitalizeFolderWords(suggestedFolder);
  }

  const parts = suggestedFolder.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return 'Outros';

  const master = parts[0];
  const subparts = parts.slice(1);

  const REDUNDANT_NAMES = new Set([
    'turismo, viagens & eventos',
    'viagens, turismo & eventos',
    'jogos & games',
    'jogos e games',
    'governo & cidadania',
    'governo e cidadania',
    'programação, dev & ia',
    'programacao, dev & ia',
    'programação & dev',
    'estudos & educação',
    'estudos e educação',
    'lojas & compras',
    'lojas e compras',
    'compras & lojas',
    'tecnologia & informática',
    'tecnologia e informática',
    'saúde, fitness & bem-estar',
    'saude, fitness e bem estar',
    'negócios & carreira',
    'filmes, séries & animes',
    'arte, design & personalização',
    'notícias & atualidades',
    'produtividade & ferramentas',
    'redes sociais & comunicação',
    'espiritualidade & religião',
    'mecânica & engenharia',
    'outros & geral',
    'geral',
    'ferramentas',
    'servicos publicos',
    'serviços públicos',
    'eletroeletrônica',
    'eletroeletronica',
    'arte & design',
  ]);

  const ALIAS_GROUPS: Record<string, string[]> = {
    'Jogos': ['games', 'jogos', 'gaming', 'jogos de pc', 'entretenimento / jogos'],
    'Dev & IA': ['dev', 'programacao', 'programação', 'dev & ia', 'ia & dev', 'desenvolvimento', 'ia', 'inteligencia artificial', 'tecnologia / programação & desenvolvimento', 'tecnologia / inteligência artificial'],
    'Tecnologia': ['tecnologia & informática', 'tecnologia', 'informatica', 'informática', 'ti', 'tech', 'dev & ia', 'dev'],
    'Governo': ['governo & cidadania', 'governo', 'cidadania', 'gov', 'serviços públicos', 'servicos publicos', 'serviços & utilidades / serviços públicos & documentos'],
    'Compras': ['lojas & compras', 'compras', 'lojas', 'shopping', 'lojas & ofertas'],
    'Estudos': ['estudos & educação', 'estudos', 'educação', 'faculdade', 'cursos', 'estudo', 'livros, artigos & pesquisa', 'faculdade & cursos'],
    'Saúde & Bem-Estar': ['saúde, fitness & bem-estar', 'saúde', 'saude', 'fitness', 'bem-estar', 'treino & nutrição', 'medicina & cuidados'],
    'Negócios & Finanças': ['negócios & carreira', 'finanças', 'financas', 'bancos', 'investimentos', 'negocios', 'negócios', 'trabalho & carreira', 'finanças / bancos, investimentos & crédito'],
    'Finanças': ['negócios & finanças', 'finanças', 'financas', 'bancos', 'investimentos', 'bancos, investimentos & crédito'],
    'Trabalho & Carreira': ['negócios & carreira', 'vagas & profissões', 'trabalho & carreira', 'carreira', 'vagas', 'empregos'],
    'Filmes & Séries': ['filmes, séries & animes', 'filmes', 'series', 'séries', 'cinema', 'streaming & mídia', 'animes & mangás'],
    'Entretenimento': ['jogos', 'filmes & séries', 'animes & mangás', 'streaming & mídia'],
    'Arte & Design': ['arte, design & personalização', 'arte & design', 'design', 'arte', 'design & ilustração', 'wallpapers & ícones'],
    'Viagens & Turismo': ['turismo, viagens & eventos', 'viagens', 'turismo', 'viagem'],
    'Redes Sociais': ['redes sociais & comunicação', 'redes sociais', 'sociais', 'social', 'comunicação & redes sociais', 'redes sociais & mensagens'],
    'Comunicação & Redes Sociais': ['redes sociais & comunicação', 'redes sociais', 'sociais', 'social', 'redes sociais & mensagens', 'comunicação & redes sociais'],
    'Produtividade': ['produtividade & ferramentas', 'produtividade', 'utilitários', 'ferramentas online', 'serviços & utilidades'],
    'Serviços & Utilidades': ['serviços & utilidades', 'ferramentas online', 'serviços públicos & documentos', 'governo', 'produtividade', 'utilitários'],
    'Notícias': ['notícias & atualidades', 'notícias', 'noticias', 'jornais', 'notícias & informação'],
    'Notícias & Informação': ['notícias & atualidades', 'notícias', 'noticias', 'jornais', 'notícias & informação'],
    'Espiritualidade': ['espiritualidade & religião', 'religião', 'espiritualidade', 'fé', 'religião & filosofia', 'astrologia & numerologia', 'cabala & hermetismo'],
    'Eletrônica': ['eletroeletrônica', 'eletrônica', 'eletronica', 'elétrica', 'eletrônica & circuitos', 'microcontroladores & diy'],
    'Eletroeletrônica': ['eletroeletrônica', 'eletrônica', 'eletronica', 'elétrica', 'eletrônica & circuitos'],
    'Engenharia & Mecânica': ['mecânica & engenharia', 'engenharia', 'mecanica', 'mecânica', 'mecânica / automotiva', 'mecânica / industrial & usinagem'],
    'Mecânica': ['engenharia & mecânica', 'mecânica & engenharia', 'engenharia', 'mecanica', 'mecânica'],
    'Música': ['músicas', 'musicas', 'música', 'musica', 'som', 'hinários & ccb', 'partituras, cifras & teoria', 'instrumentos & áudio'],
    'Outros': ['outros & geral', 'outros', 'diversos'],
  };

  let matchedMaster = master;
  for (const [canonical, aliases] of Object.entries(ALIAS_GROUPS)) {
    if (canonical.toLowerCase() === master.toLowerCase() || aliases.includes(master.toLowerCase())) {
      for (const existing of existingFolderNames) {
        const existingLower = existing.toLowerCase().trim();
        // Discard old legacy redundant strings in existing folders
        if (REDUNDANT_NAMES.has(existingLower)) {
          continue;
        }
        if (aliases.includes(existingLower) || existingLower === canonical.toLowerCase()) {
          matchedMaster = capitalizeFolderWords(existing);
          break;
        }
      }
      break;
    }
  }

  // Filter subparts against matchedMaster and redundancies
  const redundantSet = MASTER_REDUNDANT_SUBFOLDERS[matchedMaster];
  const cleanedSubparts: string[] = [];
  const seenParts = new Set<string>([matchedMaster.toLowerCase()]);

  for (const part of subparts) {
    const pLower = part.toLowerCase().trim();
    if (!pLower || pLower === 'geral' || pLower === '(geral)') continue;
    if (seenParts.has(pLower)) continue;
    if (redundantSet && redundantSet.has(pLower)) continue;

    cleanedSubparts.push(part);
    seenParts.add(pLower);
  }

  const result = cleanedSubparts.length > 0
    ? `${matchedMaster} / ${cleanedSubparts.join(' / ')}`
    : matchedMaster;

  return capitalizeFolderWords(result);
}

/**
 * Deep semantic heuristic classification with non-redundant hierarchical categories.
 */
export function classifyBookmarkIntelligently(
  title: string,
  url: string,
  folderContext: string = ''
): string {
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

  // 2. DEV & IA
  const isAI =
    /\b(claude|chatgpt|openai|ollama|huggingface|llm|ia|ai|intelig[eê]ncia\s?artificial|prompt|neural|machine\s?learning|deep\s?learning|perplexity|midjourney|copilot|gemini|colaboratory|colab|elevenlabs|suno|sunoforge|deepseek|deepseekv3|neuralwriter|quillbot|zerogpt|hunyuan|metademolab|labs\.google|multiagente|agentic|stable\s?diffusion|grok|antigravity|civitai|metaverso)\b/i.test(
      fullText
    );
  const isDev =
    /\b(github|gitlab|bitbucket|stack\s?overflow|api|sdk|npm|pypi|docker|kubernetes|código|code|dev|frontend|backend|programar|programando|programação|programacao|linguagemc|visualg|c\+\+|c\#|python|javascript|typescript|react|vue|angular|java|php|sql|mysql|postgresql|sqlite|mongodb|algoritmo|algoritmos|css|html5|devmedia|portugol|android\s?studio|vscode|visual\s?studio|channel9|msdn|developer\.android|vulkan|ndk|vercel|skills\.sh|healthchecks\.io|tailscale|zerotier|akitaonrails|4devs)\b/i.test(
      fullText
    );

  if (isAI || isDev) {
    if (isAI && !/\b(c\+\+|c\#|python|javascript|visual\s?studio|portugol|github|gitlab)\b/i.test(fullText)) {
      return 'Dev & IA / Inteligência Artificial';
    }
    if (/\b(github|gitlab|bitbucket|reposit[oó]rio|gist|sourceforge)\b/i.test(fullText)) {
      return 'Dev & IA / Repositórios';
    }
    if (/\b(stack\s?overflow|stackexchange|clube\s?do\s?hardware.*(c|c\+\+|java|python|c\#|sql|program)|forum|duvida|dúvida)\b/i.test(fullText)) {
      return 'Dev & IA / Comunidade & Dúvidas';
    }
    if (/\b(learn\.microsoft|docs\.microsoft|developer\.mozilla|devmedia|portugol|w3schools|devdocs|documenta[cç][aã]o|tutorial.*program|apostila.*program|linguagemc|visualg|algoritmo)\b/i.test(fullText)) {
      return 'Dev & IA / Documentação';
    }
    return 'Dev & IA / Ferramentas';
  }

  // 3. JOGOS
  const isGame =
    /\b(nexusmods|fitgirl|torrentgamesps3|psxdownloads|mixmods|coolrom|steam|steampowered|epicgames|roblox|twitch|poe\.ninja|mobalytics|maxroll|elderscrolls|fallout|skyrim|ps[1-5]|playstation|xbox|nintendo|switch|game|jogos?|gameplay|emulador|rpcs3|pcsx2|retroarch|roms?|curseforge|modding|gamevicio|kotaku|voxel|speedrun|minecraft|diablo|elden\s?ring|dark\s?souls|gta|resident\s?evil|assassin'?s\s?creed|thewitcher|witcher|god\s?of\s?war|gran\s?turismo|gt6|horizon\s?zero|red\s?dead|pokemon|pokémon|zelda|mario|pathofexile|path\s?of\s?exile|poe2|poe\s?2|filterblade|craftofexile|poe2db|poe2builder|ppsspp|vimm\.net|cdromance|mugen|mugenation|mugenguild|modrinth|faithfulpack|inforcraft|terralith|aom\.heavengames|smite2|skse|soul\s?reaver|retroachievements|bonkerslots|icy-veins|overwolf|taskbarhero|filecrypt|ggmax|steamdb|devil\s?may\s?cry|mortal\s?kombat|mk|fatalit|mordhau|ryse|crimson\s?desert|dante|cheats|unknowncheats|gamehacking|nenyooo|wabbajack|loadorderlibrary|x360ce|gamepad|ipega|kart|kart[oó]dromo|gtplanet|dyndolod|lod|delirious|divines|skidrow|reloaded|yougametubebr|kof\s?98|the\s?king\s?of\s?fighters|central-mods|martysmods|enbdev|patreon.*(combo|archer|mod|build))\b/i.test(
      fullText
    );

  if (isGame) {
    if (/\b(ps[1-5]|playstation|psx|ps3|ps4|ps5|gt6|gran\s?turismo|torrentgamesps3|psxdownloads|sony|dualsense|dualshock|cdromance|soul\s?reaver|dante|devil\s?may\s?cry)\b/i.test(fullText)) {
      return 'Jogos / PlayStation';
    }
    if (/\b(nintendo|switch|wii|gamecube|n64|3ds|ds|zelda|mario|pok[eé]mon|metroid|citra|yuzu|snes)\b/i.test(fullText)) {
      return 'Jogos / Nintendo';
    }
    if (/\b(xbox|game\s?pass|xbox\s?360|xbox\s?one|series\s?[xs]|halo|forza|gears)\b/i.test(fullText)) {
      return 'Jogos / Xbox';
    }
    if (/\b(nexusmods|mixmods|curseforge|mods?|modding|enb|skse|modorganizer|vortex|shader|modrinth|faithfulpack|filterblade|mugen|mugenation|mugenguild|dyndolod|lod|wabbajack|loadorderlibrary|unknowncheats|gamehacking|nenyooo|mordhau|central-mods|martysmods|enbdev|patreon)\b/i.test(fullText)) {
      return 'Jogos / Mods';
    }
    if (/\b(coolrom|emulador|emulator|retroarch|rpcs3|pcsx2|roms?|bios|iso|ppsspp|vimm\.net|retroachievements|x360ce|snesforever)\b/i.test(fullText)) {
      return 'Jogos / Emuladores & ROMs';
    }
    if (/\b(poe\.ninja|mobalytics|maxroll|fandom|skyrim|fallout|elderscrolls|wiki|guia|build|detonado|ign|gamevicio|poe2db|poe2builder|craftofexile|icy-veins|taskbarhero|timesaver|cheat|fatalit|neoseeker|kof|the\s?king\s?of\s?fighters)\b/i.test(fullText)) {
      return 'Jogos / Wikis & Guias';
    }
    if (/\b(steam|epic\s?games|gog|fitgirl|itch\.io|roblox|pc\s?gamer|twitch|minecraft|path\s?of\s?exile|pathofexile|steamdb|ea\.com|capcom|skidrow|reloaded|delirious|divines)\b/i.test(fullText)) {
      return 'Jogos / PC';
    }
    return 'Jogos';
  }

  // 4. ELETRÔNICA
  const isElectro =
    /\b(eletr[oô]nica|el[eé]trica|circuito|esquem[aá]tico|arduino|esp32|esp8266|raspberry|transistor|resistor|capacitor|diodo|kicad|easyeda|alldatasheet|mouser|digikey|datasheet|mult[ií]metro|oscilosc[oó]pio|aterramento|disjuntor|painel\s?solar|inversor|unifilar|eletricista|quadro\s?de\s?distribui[cç][aã]o|tinkercad|soldagem\s?eletr[oô]nica|transformador|bateria\s?18650|jammer|fio\/cabo|bitola|cabos?\s?el[eé]tricos?|amplificador|alto-falante|kostal|microcontrolandos|proteus)\b/i.test(
      fullText
    );

  if (isElectro) {
    if (/\b(arduino|esp32|esp8266|raspberry|microcontrolador|microcontroller|embarcados|microcontrolandos)\b/i.test(fullText)) {
      return 'Eletrônica / Microcontroladores & DIY';
    }
    if (/\b(easyeda|kicad|proteus|fritzing|pcb|circuito|esquem[aá]tico|schematic|falstad)\b/i.test(fullText)) {
      return 'Eletrônica / Circuitos & Esquemas';
    }
    if (/\b(alldatasheet|mouser|digikey|datasheet|transistor|capacitor|resistor|ci|ic|mosfet|diodo)\b/i.test(fullText)) {
      return 'Eletrônica / Componentes & Datasheets';
    }
    if (/\b(aterramento|el[eé]trica|eletricista|disjuntor|unifilar|quadro|inversor|energia\s?solar|fotovoltaic|cabos?\s?el[eé]tricos?|bitola|transformador)\b/i.test(fullText)) {
      return 'Eletrônica / Instalações & Energia';
    }
    return 'Eletrônica';
  }

  // 5. ENGENHARIA & MECÂNICA
  const isMech =
    /\b(mec[aâ]nica|automotivo|automotiva|autopapo|ve[ií]culo|scania|trator|tractor|usinagem|torno|fresa|cnc|solidworks|autodesk|grabcad|thingiverse|printables|motor|motores|oficina|lojadomecanico|pe[cç]as\s?auto|chassi|freio|suspens[aã]o|inspe[cç][aã]o\s?veicular|t[eé]cnico\s?mec[aâ]nico|c[aâ]mbio|embreagem|inje[cç][aã]o\s?eletr[oô]nica|torque|gestauto|iveco|caminh[aã]o|motoniveladora|retroescavadeira|escavadeira|caterpillar|komatsu|john\s?deere|volvo\s?trucks|mercedes.*axor|pneu|calibragem|óleo.*caminhão|vistoriapro|seguradora\s?lider|dpvat|kartodromo|reboque|volkswagenag|elsa2go|koenigsegg|porsche|rennsport|sedan|bmw|doutor\s?carro|doutorie|rolamento|sonda\s?lambda|yamaha|xt660|honda|pantogr[aá]fico|raven|elevador\s?raven|sekurit|vidros\s?originais|latinncap|verniz|massa\s?corrida|lixamento|lixa\s?\d+|sanca\s?de\s?gesso|gesso|volume\s?de\s?gesso|sanca|reforma|obra|pincel|pinc[eé]is|trinchas|argalit|mhhauto|car-specs|ultimatespecs|carrosnaweb|tuatara|centodieci|nemigaparts|corsaclube|carros\s?usados|noticiasautomotivas|apex\s?tool|belzer|pedivela|movimento\s?central|pintar\s?(porta|madeira)|peltier|electude|c6auto)\b/i.test(
      fullText
    );

  if (isMech) {
    if (/\b(solidworks|grabcad|autocad|fusion|thingiverse|printables|3d|cad|cam|modelagem|perspectiva\s?isom[eé]trica)\b/i.test(fullText)) {
      return 'Engenharia & Mecânica / CAD & Modelagem 3D';
    }
    if (/\b(usinagem|torno|fresa|cnc|ret[ií]fica|ferramentas?|lojadomecanico|equipamentos|mundomanuais|motoniveladora|retroescavadeira|escavadeira|caterpillar|komatsu|chave\s?para\s?escavadeira|verniz|massa\s?corrida|lixamento|lixa|sanca|gesso|pincel|trincha|argalit|belzer|apex\s?tool|pedivela)\b/i.test(fullText)) {
      return 'Engenharia & Mecânica / Usinagem & Ferramentas';
    }
    if (/\b(inspe[cç][aã]o\s?veicular|t[eé]cnico\s?mec[aâ]nico|manuten[cç][aã]o\s?mec[aâ]nica|abnt|senai|gestauto|ficha\s?de\s?inspeção|vistoriapro|norma\s?t[eé]cnica\s?din|engeteles|rolamento|falhas\s?em\s?rolamentos|latinncap)\b/i.test(fullText)) {
      return 'Engenharia & Mecânica / Inspeção & Manutenção';
    }
    if (/\b(autopapo|ve[ií]culo|carro|moto|scania|trator|caminh[aã]o|motor|c[aâ]mbio|suspens[aã]o|oficina|freio|chassi|iveco|volvo|mercedes|pneu|calibragem|nissan|koenigsegg|porsche|gol\s?1\.0|bmw|doutor\s?carro|doutorie|sonda\s?lambda|yamaha|xt660|honda|sekurit|pantogr[aá]fico|raven|mhhauto|car-specs|ultimatespecs|carrosnaweb|tuatara|centodieci|nemigaparts|corsaclube|carros\s?usados|noticiasautomotivas|c6auto)\b/i.test(fullText)) {
      return 'Engenharia & Mecânica / Automotivo';
    }
    return 'Engenharia & Mecânica';
  }

  // 6. MÚSICA
  const isMusic =
    /\b(m[uú]sica|music|som|audio|[aá]udio|spotify|deezer|cifraclub|violino|viola|viol[aã]o|teclado|piano|luthier|luteria|partitura|partituras|solfejo|hin[aá]rio|hinos?|ccb|congregacao\s?crista|cifra|tablatura|songsterr|sound|acorde|afina[cç][aã]o|nota\s?l[aá]|440\s?hz|bach|chaconne|cello|pozzoli|orquestra|filarmonica|tocata|sinfonia|cifradventista|muse\s?sounds|mozart|requiem|polifonia|oitavado|ubc|musescore|atelierlabussiere|chordu|amar\.art|atelierkamroyan|ecad|musicaliza[cç][aã]o|violinistas|canalparaviolinistas)\b/i.test(
      fullText
    );

  if (isMusic) {
    if (/\b(ccb|congregacao\s?crista|hinos?|hin[aá]rio|ensaios?|reuni[aã]o\s?de\s?jovens|sistema\s?de\s?administra[cç][aã]o\s?musical|evangelizarccb|cifradventista)\b/i.test(fullText)) {
      return 'Música / Hinários & CCB';
    }
    if (/\b(violino|viola|viol[aã]o|teclado|piano|luthier|luteria|instrumentos?|cravelha|espalheira|arco|cordas|cello|atelierlabussiere|atelierkamroyan)\b/i.test(fullText)) {
      return 'Música / Instrumentos & Luthiaria';
    }
    if (/\b(partitura|partituras|cifra|cifras|tablatura|cifraclub|songsterr|ultimate\s?guitar|sheet|musescore|chordu)\b/i.test(fullText)) {
      return 'Música / Partituras & Cifras';
    }
    if (/\b(teoria|solfejo|bona|escalas|harmonia|compasso|ritmo|pozzoli|440\s?hz|afina[cç][aã]o|tonalidades|polifonia|oitavado)\b/i.test(fullText)) {
      return 'Música / Teoria & Solfejo';
    }
    if (/\b(spotify|deezer|youtube\s?music|soundcloud|bandcamp|orquestra|filarmonica|sinfonia|bach|mozart|requiem)\b/i.test(fullText)) {
      return 'Música / Streaming';
    }
    return 'Música';
  }

  // 7. TECNOLOGIA
  const isTech =
    /\b(android|samsung|motorola|xiaomi|smartphone|celular|windows|formatar|formata[cç][aã]o|bios|driver|drivers|intel|amd|ryzen|geforce|rtx|gtx|processador|placa\s?m[aã]e|mem[oó]ria\s?ram|ssd|hd|pendrive|hardware|clubedohardware|hardware\.com|techtudo|canaltech|olhar\s?digital|oficinadanet|tudocelular|nextpit|apkpure|rexdl|apkmirror|root|magisk|twrp|bootloader|rom\s?custom|firmware|192\.168|roteador|modem|wi-?fi|rede|dns|ip|airdroid|remotedesktop|anydesk|teamviewer|xdaforums|hwinfo|egpu|quickcpu|can\s?you\s?run\s?it|virustotal|hybrid-analysis|any\.run|edge\s?extensions|microsoftedge|truecaller|fiberhome|dd-wrt|supersu|lenovo|tpm|minhaclaro|claro\.com|vivo\.com|tim\.com|downdetector|razer|surround|hdmi|dvi|dhcp|bbbaterias|problema\s?na\s?fonte|4k\s?monitors?|monitor\s?4k|techspot|cpuid|cpu-z|chrome:\/\/flags|edge:\/\/flags|flags\b|bluestacks|bluewa)\b/i.test(
      fullText
    );

  if (isTech) {
    if (/\b(android|samsung|motorola|xiaomi|celular|smartphone|apk|apkpure|rexdl|root|magisk|twrp|bootloader|rom\s?custom|tudocelular|xdaforums|truecaller|supersu|bluestacks|bluewa)\b/i.test(fullText)) {
      return 'Tecnologia / Android';
    }
    if (/\b(windows|formatar|formata[cç][aã]o|driver|drivers|office|word|excel|sistema\s?operacional|powershell|cmd|quickcpu|microsoftedge|tpm|lenovo|edge\s?extensions|flags|virtualbox|k-lite|codec|dvdvideosoft|dropit)\b/i.test(fullText)) {
      return 'Tecnologia / Windows & Sistemas';
    }
    if (/\b(hardware|clubedohardware|intel|amd|ryzen|geforce|processador|placa\s?m[aã]e|mem[oó]ria\s?ram|ssd|fonte|perif[eé]ricos|hwinfo|egpu|can\s?you\s?run\s?it|razer|hdmi|dvi|dhcp|bbbaterias|problema\s?na\s?fonte|4k\s?monitor|techspot|cpuid|cpu-z|crystalmark|crystaldiskinfo)\b/i.test(fullText)) {
      return 'Tecnologia / Hardware';
    }
    if (/\b(192\.168|roteador|modem|wi-?fi|rede|dns|ip|airdroid|remotedesktop|anydesk|virustotal|hybrid-analysis|any\.run|fiberhome|dd-wrt|downdetector|minhaclaro|claro|vivo|tim)\b/i.test(fullText)) {
      return 'Tecnologia / Redes & Segurança';
    }
    return 'Tecnologia';
  }

  // 8. SAÚDE & BEM-ESTAR
  const isHealth =
    /\b(sa[uú]de|fitness|suplemento|suplementos|emagrecimento|perder\s?barriga|dieta|prote[ií]na|tuasaude|natusvita|gsuplementos|growth|treino|muscula[cç][aã]o|academia|receita|receitas|rem[eé]dio|medicamento|hapvida|m[eé]dico|hospital|nutri|calorias|vitaminas?|anatomia|peso|jejum|carboidrato|creatina|whey|mutant\s?mass|calos|doctor\s?feet|farmacia|l'oreal|glandulas\s?sebaceas|astigmatismo|lenscope|óculos|ocitocina|horm[oô]nio|desejo\s?sexual|antiss[oó]dio|hipertens[aã]o|reten[cç][aã]o|gordura\s?localizada|resist[eê]ncia\s?na\s?corrida|ativo\.com|inhame|pudim|bolo|torta|cozimento|culin[aá]ria|vegano|vegetariano|presunto\s?vegetariano|dicas\s?veganas|descascar\s?batatas|veganize|cantinho\s?vegetariano|bodynutry|fimose|cirurgia|banho\s?de\s?sol|ch[aá]\s?mate|ch[aá]|alimentos?|nutri[cç][aã]o|circula[cç][aã]o|abd[oô]men|trincar\s?a?\s?barriga|barriga|[aá]cido\s?l[aá]tico|lactato|muscular|m[uú]sculos?|espinhas?|bacne|caminhar\s?emagrece|imc|calcule\s?seu\s?imc|aspartame|doce\s?veneno|suco|feij[aã]o|fruta|verdura|legume|percentual\s?de\s?gordura|ollie|gordura|treinus|exercicioemcasa|skate|auto-hemoterapia|dynamed|dietacrua|vapza|biotipo|neat\b|metabolismo|acne|nutrientes|nutritienda|endom[oó]rfico|ectomorfo|mesomorfo)\b/i.test(
      fullText
    );

  if (isHealth) {
    if (/\b(suplemento|suplementos|prote[ií]na|creatina|whey|natusvita|gsuplementos|growth|vitaminas?|mutant\s?mass|bodynutry|receita|receitas|culin[aá]ria|alimento|alimentos|ch[aá]|suco|comida|dieta|carboidrato|vegano|vegetariano|pudim|bolo|torta|cozimento|batata|veganize|cantinho\s?vegetariano|presunto\s?vegetariano|feij[aã]o|fruta|verdura|legume|aspartame|dietacrua|vapza|nutrientes|nutritienda)\b/i.test(fullText)) {
      return 'Saúde & Bem-Estar / Nutrição & Suplementos';
    }
    if (/\b(fitness|treino|muscula[cç][aã]o|academia|exerc[ií]cio|emagrecimento|perder\s?barriga|peso|corrida|resist[eê]ncia\s?na\s?corrida|ativo\.com|caminhar\s?emagrece|abd[oô]men|trincar|barriga|[aá]cido\s?l[aá]tico|lactato|muscular|m[uú]sculo|percentual\s?de\s?gordura|ollie|treinus|exercicioemcasa|skate|neat\b|biotipo|endom[oó]rfico|ectomorfo|mesomorfo|metabolismo)\b/i.test(fullText)) {
      return 'Saúde & Bem-Estar / Treino & Fitness';
    }
    if (/\b(tuasaude|hapvida|m[eé]dico|hospital|rem[eé]dio|medicamento|sintoma|sintomas|doen[cç]a|exame|anatomia|doctor\s?feet|farmacia|lenscope|óculos|ocitocina|horm[oô]nio|antiss[oó]dio|hipertens[aã]o|fimose|cirurgia|banho\s?de\s?sol|espinhas?|bacne|circula[cç][aã]o|imc|auto-hemoterapia|dynamed|acne)\b/i.test(fullText)) {
      return 'Saúde & Bem-Estar / Medicina & Cuidados';
    }
    return 'Saúde & Bem-Estar';
  }

  // 9. ESTUDOS
  const isEdu =
    /\b(estudo|estudos|curso|cursos|concurso|concursos|portaleduca|sestsenat|enem|fuvest|vestibular|prova|scribd|pdfcoffee|archive\.org|z-lib|livro|livros|biblioteca|faculdade|universidade|uninter|estacio|fatecie|senac|mec|e-mec|abnt|scielo|scholar|idioma|idiomas|ingl[eê]s|portugu[eê]s|gram[aá]tica|matem[aá]tica|f[ií]sica|qu[ií]mica|filosofia|hist[oó]ria|biologia|fauna|flora|artigo|tese|aula|aulas|geometria|c[aá]lculo|lacconcursos|mesalva|guiadoestudante|qconcursos|bvirtual|scilab|maxima|matlab|worldcat|doceru|conjugacao|abed|documento\s?do\s?estudante|forma\s?brasil|certifica[cç][aã]o\s?por\s?compet[eê]ncia|ietaam|pronounce|toucan|memorizar|alem[aã]o|german|shadowing|speaking|conversas|conversação|ouino|duolingo|geogebra|socrative|oba\b|pensador|passeidireto|c[eé]lula|contronyms|kroton|senai|monsterconcursos|porcentagem|fra[cç][oõ]es|decimais|astronomia|carl\s?sagan|universo\s?bidimensional|ci[eê]ncia|revistas?\s?gr[aá]tis|tcc|estudantes?\s?universit[aá]rios?|benef[ií]cios?\s?universit[aá]rio|aluno\s?digital|anhanguera|cefet|cefetmg|colaborar|colaboraread|dicio|sambatech|institutodeengenharia|elivros|cesec|exame\s?de\s?banca|esquemaria)\b/i.test(
      fullText
    );

  if (isEdu) {
    if (/\b(concurso|concursos|enem|fuvest|vestibular|portaleduca|sestsenat|lacconcursos|mesalva|guiadoestudante|qconcursos|prova|gabarito|edital|quest[aã]o|monsterconcursos|cesec|exame\s?de\s?banca|esquemaria)\b/i.test(fullText)) {
      return 'Estudos / Concursos & Cursos';
    }
    if (/\b(scribd|pdfcoffee|archive\.org|biblioteca|livro|livros|pdf|e-?book|apostila|leitura|books\.google|bvirtual|worldcat|doceru|passeidireto|abnt|scielo|scholar|artigo\s?cient[ií]fico|tese|disserta[cç][aã]o|norma\s?t[eé]cnica|revistas?\s?gr[aá]tis|tcc|bdtd|elivros)\b/i.test(fullText)) {
      return 'Estudos / Livros & Artigos';
    }
    if (/\b(faculdade|universidade|uninter|estacio|fatecie|senac|e-?mec|mec\.gov|gradua[cç][aã]o|p[oó]s-gradua[cç][aã]o|forma\s?brasil|certifica[cç][aã]o\s?por\s?compet[eê]ncia|ietaam|abed|kroton|senai|socrative|estudantes?\s?universit[aá]rios?|benef[ií]cios?\s?universit[aá]rio|aluno\s?digital|anhanguera|cefet|colaborar|sambatech|institutodeengenharia)\b/i.test(fullText)) {
      return 'Estudos / Faculdades & EAD';
    }
    if (/\b(idioma|idiomas|ingl[eê]s|english|portugu[eê]s|gram[aá]tica|dicion[aá]rio|vocabulary|pronounce|toucan|conjugacao|alem[aã]o|german|shadowing|speaking|conversas|conversação|ouino|duolingo|contronyms|dicio)\b/i.test(fullText)) {
      return 'Estudos / Idiomas';
    }
    if (/\b(matem[aá]tica|f[ií]sica|qu[ií]mica|c[aá]lculo|geometria|[aá]lgebra|scilab|maxima|matlab|geogebra|oba\b|porcentagem|fra[cç][oõ]es|decimais|carl\s?sagan|universo\s?bidimensional|ci[eê]ncia|astronomia)\b/i.test(fullText)) {
      return 'Estudos / Ciências Exatas';
    }
    if (/\b(filosofia|hist[oó]ria|sociologia|geografia|pensador|biologia|fauna|flora|animais|plantas|c[eé]lula)\b/i.test(fullText)) {
      return 'Estudos / Ciências Humanas';
    }
    return 'Estudos';
  }

  // 10. NEGÓCIOS & FINANÇAS
  const isBusiness =
    /\b(sebrae|contabilizei|cnpj|mei|abrir\s?empresa|empresa|neg[oó]cio|emprego|empregos|vagas?|trabalho|curr[ií]culo|banco|investimento|b3|statusinvest|fundamentus|infomoney|bv\.com|meutudo|arpejo|renda|finan[cç]as|paypal|ita[uú]|mercadopago|mepoupe|guardardinheiro|abac|idinheiro|consorcio|aluguel|financiamento|inpi|marca|patente|registrodemarca|zendesk|b2b|universia|carreiras|aterpa|escola\s?do\s?trabalhador|ponto\s?mais|f[eé]rias|minimum-wage|green\s?card|vale\.com|abb|hotmart|serasa|tabela\s?para\s?juntar|poupar|tesouro\s?direto|genial|empiricus|canal\s?dark|auditoria|juntar\s?10\s?mil|canal\s?conecta|empregabilidade|administra[cç][aã]o\s?de\s?vendas|crm|easynvest|juros|cart[oõ]es\s?de\s?cr[eé]dito|parcelas?|foregon|conjur|mobills|apexfintech|economiasemsegredos|kwai.*dinheiro|ganhar\s?dinheiro)\b/i.test(
      fullText
    );

  if (isBusiness) {
    if (/\b(sebrae|contabilizei|cnpj|mei|abrir\s?empresa|contabilidade|empresa|neg[oó]cio|inpi|marcas?|patente|zendesk|b2b|canal\s?dark|administra[cç][aã]o\s?de\s?vendas|crm|ganhar\s?dinheiro)\b/i.test(fullText)) {
      return 'Negócios & Finanças / Empreendedorismo & Marcas';
    }
    if (/\b(emprego|empregos|vagas?|trabalho|curr[ií]culo|contrata|processo\s?seletivo|universia|carreiras|vale\.com|escola\s?do\s?trabalhador|abb|green\s?card|canal\s?conecta|empregabilidade)\b/i.test(fullText)) {
      return 'Negócios & Finanças / Vagas & Carreira';
    }
    if (/\b(banco|investimento|investir|b3|statusinvest|fundamentus|infomoney|ações|fiis|tesouro|carteira|cr[eé]dito|empr[eé]stimo|renda|paypal|ita[uú]|mercadopago|mepoupe|guardardinheiro|abac|idinheiro|financiamento|hotmart|serasa|poupar|genial|empiricus|auditoria|juntar\s?10\s?mil|easynvest|juros|cart[oõ]es\s?de\s?cr[eé]dito|parcelas?|foregon|conjur|mobills|apexfintech|economiasemsegredos)\b/i.test(fullText)) {
      return 'Negócios & Finanças / Investimentos & Bancos';
    }
    return 'Negócios & Finanças';
  }

  // 11. ESPIRITUALIDADE
  const isReligion =
    /\b(b[ií]blia|estudosdabiblia|congregacaocristanobrasil|conteudoespirita|emsonho|sonhos?\.com|guiadaalma|evangelho|deus|ora[cç][aã]o|espiritismo|espiritualidade|teologia|mitologia|lendas|folclore|amorc|rosacruz|abrame|v[oó]s\s?sois\s?deuses|gematria|astrologia|hor[oó]scopo|mapa\s?astral|astrolink|viastral|personare|numerologia|kabbalah|cabala|sacramentos|significado\s?espiritual|awakened|spine|caduceu|elohim|hebrew|transliteration|hermetically|astrvm\s?argentvm|ordoaa|abismo|thelema|crowley|febnet|federa[cç][aã]o\s?esp[ií]rita|dicion[aá]rio\s?de\s?s[ií]mbolos)\b/i.test(
      fullText
    );

  if (isReligion) {
    if (/\b(b[ií]blia|estudosdabiblia|congregacao|hino|vers[ií]culo|evangelho|teologia|apologetica|exodo|sacramentos|elohim|hebrew)\b/i.test(fullText)) {
      return 'Espiritualidade / Bíblia & Teologia';
    }
    if (/\b(astrologia|hor[oó]scopo|mapa\s?astral|astrolink|viastral|personare|numerologia|kabbalah|cabala|gematria|fases\s?da\s?lua|calendario\s?lunar)\b/i.test(fullText)) {
      return 'Espiritualidade / Astrologia & Numerologia';
    }
    if (/\b(sonho|sonhos|significado\s?dos\s?sonhos|espiritismo|espirita|guiadaalma|amorc|rosacruz|mitologia|lendas|folclore|awakened|caduceu|hermetically|astrvm|ordoaa|abismo|thelema|crowley|febnet|dicion[aá]rio\s?de\s?s[ií]mbolos|wemystic|vida\s?espiritual)\b/i.test(fullText)) {
      return 'Espiritualidade / Filosofia & Misticismo';
    }
    return 'Espiritualidade';
  }

  // 12. GOVERNO
  const isGov =
    /\b(gov\.br|detran|detran\.mg|planalto|prefeitura|contagem|fazenda|receita\s?federal|cnh|ipva|multa|legisla[cç][aã]o|lei|decreto|di[aá]rio\s?oficial|título\s?de\s?eleitor|inss|previd[eê]ncia|vakinha|crea|confea|resolvvi|advogado|jusbrasil|contran|tse|naomeperturbe|dni|cadastro\s?[uú]nico|cad[uú]nico|benef[ií]cios?\s?para\s?quem\s?é\s?cadastrado|cart[oó]rio|vara\s?de\s?fam[ií]lia|certid[aã]o|cft|trt|comprovante\s?de\s?resid[eê]ncia|aprovadetran|exame\s?de\s?dire[cç][aã]o)\b/i.test(
      fullText
    );

  if (isGov) {
    if (/\b(detran|cnh|ipva|multa|ve[ií]culo|tr[aâ]nsito|contran|aprovadetran|exame\s?de\s?dire[cç][aã]o)\b/i.test(fullText)) {
      return 'Governo / Trânsito & Detran';
    }
    return 'Governo / Serviços Públicos';
  }

  // 13. FILMES & SÉRIES
  const isCinema =
    /\b(filme|filmes|s[eé]rie|s[eé]ries|anime|animes|netflix|primevideo|disney\+|max|hbomax|crunchyroll|imdb|letterboxd|cinema|torrent|ondebaixa|reidostorrents|comando\s?torrents|torrentclaw|stremio|plex|jellyfin|saikoani|dailymotion|star\+|origem|sherlock\s?holmes|alem\s?da\s?linha|prendame|yu\s?yu\s?hakusho|ok\.ru\/video|trailer|dublado|legendado|adorocinema|revistabula|legiaodosherois|bludv|atra[ií]dos\s?pelo\s?perigo|dragon\s?ball|goku|eles\s?vivem)\b/i.test(
      fullText
    );

  if (isCinema) {
    if (/\b(anime|animes|crunchyroll|manga|saikoani|yu\s?yu\s?hakusho|otaku|tokyo\s?ghoul|naruto|dragon\s?ball|goku|shurato)\b/i.test((title || '').toLowerCase())) {
      return 'Filmes & Séries / Animes';
    }
    if (/\b(torrent|ondebaixa|reidostorrents|torrentclaw|download|bludv)\b/i.test(fullText)) {
      return 'Filmes & Séries / Torrents & Downloads';
    }
    if (/\b(stremio|plex|jellyfin|star\+|netflix|primevideo|disney\+|max|ok\.ru|eles\s?vivem)\b/i.test(fullText)) {
      return 'Filmes & Séries / Streaming';
    }
    return 'Filmes & Séries';
  }

  // 14. ARTE & DESIGN
  const isArt =
    /\b(arte|artes|desenho|pintura|escultura|arquitetura|design|designer|decora[cç][aã]o|planta\s?baixa|fachada|hq|quadrinhos|comic|manga|mang[aá]|deviantart|artstation|canva|inkscape|custom-cursor|cursor|icon-icons|ícones|wallpaper|wallpapers|wallhaven|alphacoders|visualskins|rainmeter|free3d|3d\s?models|blender|artvee|create\.vista|floorplanner)\b/i.test(
      fullText
    );

  if (isArt) {
    if (/\b(custom-cursor|cursor|icon-icons|ícones|wallpaper|wallpapers|wallhaven|alphacoders|visualskins|rainmeter|betterdiscord)\b/i.test(fullText)) {
      return 'Arte & Design / Wallpapers & Ícones';
    }
    if (/\b(arquitetura|planta\s?baixa|fachada|decora[cç][aã]o|reforma|constru[cç][aã]o|floorplanner)\b/i.test(fullText)) {
      return 'Arte & Design / Arquitetura & Construção';
    }
    if (/\b(hq|quadrinhos|comic|manga|mang[aá]|universo\s?hq)\b/i.test(fullText)) {
      return 'Arte & Design / Quadrinhos & HQs';
    }
    return 'Arte & Design / Modelagem 3D & Design';
  }

  // 15. COMPRAS
  const isShop =
    /\b(loja|lojas|produto|produtos|mercadolivre|amazon|shopee|aliexpress|kabum|pichau|terabyte|superepi|perfumaria|perfume|fragr[aâ]ncia|comprar|compras|pre[cç]o|promo[cç][aã]o|desconto|cupom|pelando|promobit|carrinho|pedido|correios|inktec|casas\s?bahia|zoom|netshoes|olx|ravvisa|chanel|eau\s?de|chinelo|rider|t[eê]nis|sapato|calçado|vestu[aá]rio|moda|estilo|haircuts?|cortes?\s?de\s?cabelo|cabelos?|penteados?|barba|rel[oó]gio|p[eé]rola|belezanaweb|cofermeta|metaverso|dafiti|creativefabrica|creative\s?fabrica)\b/i.test(
      fullText
    );

  if (isShop) {
    if (/\b(perfumaria|perfume|fragr[aâ]ncia|eau\s?de|col[oô]nia|cosm[eé]tico|chanel|belezanaweb)\b/i.test(fullText)) {
      return 'Compras / Perfumaria';
    }
    if (/\b(haircut|cabelo|penteado|barba|rel[oó]gio|t[eê]nis|chinelo|rider|vestu[aá]rio|moda|estilo|sapato|calçado|p[eé]rola)\b/i.test(fullText)) {
      return 'Compras / Moda & Vestuário';
    }
    if (/\b(kabum|terabyte|pichau|hardware|computador|eletr[oô]nicos|inktec|cofermeta|metaverso)\b/i.test(fullText)) {
      return 'Compras / Hardware & Informática';
    }
    if (/\b(pelando|promobit|cupom|cupons|desconto|oferta|zoom|shellbox)\b/i.test(fullText)) {
      return 'Compras / Cupons & Comparadores';
    }
    return 'Compras / Marketplaces';
  }

  // 16. PRODUTIVIDADE
  if (
    /\b(conversor|calculadora|tradutor|translate|speedtest|teste\s?de\s?velocidade|encurtador|gerador|takeout|drive\.google|onedrive|dropbox|mega\.nz|ilovepdf|iloveimg|smallpdf|miniwebtool|typeform|aspose|drivedepobre|keep\.google|forms|spreadsheets|planilha|docusign|checklist|assinatura\s?legal|obs|obsproject|grava[cç][aã]o\s?de\s?tela|bing.*creator|bing.*images|chat\.google)\b/i.test(
      fullText
    )
  ) {
    if (/\b(obs|obsproject|grava[cç][aã]o)\b/i.test(fullText)) {
      return 'Produtividade / Gravação & Edição';
    }
    return 'Produtividade / Nuvem & Arquivos';
  }

  // 17. VIAGENS & TURISMO
  if (
    /\b(viagem|viagens|turismo|hotel|hot[eé]is|pousada|voo|voos|a[eé]reo|passagem|booking|airbnb|decolar|skyscanner|tripadvisor|praia|milhas|assistentedeviagem|rentalcars|expominas|museudecongonhas|eventim|ingressos|balne[aá]rio\s?cambori[uú]|capit[oó]lio|apureguria|destinos|o\s?que\s?fazer\s?em|onde\s?ficar|roteiro)\b/i.test(
      fullText
    )
  ) {
    return 'Viagens & Turismo';
  }

  // 18. REDES SOCIAIS
  if (
    /\b(whatsapp|telegram|instagram|facebook|twitter|reddit|linkedin|tiktok|discord|linktr\.ee|gmail|mail\.google|outlook)\b/i.test(
      fullText
    )
  ) {
    return 'Redes Sociais';
  }

  // 19. NOTÍCIAS
  if (/\b(not[ií]cia|not[ií]cias|g1|uol|folha|estadao|cnn|bbc|jornal|worldometers)\b/i.test(fullText)) {
    return 'Notícias';
  }

  return 'Outros';
}

/**
 * Intelligent hybrid organization plan generator:
 * 1. Pre-filters bookmarks using high-precision DOMAIN_SUBFOLDER_MAP before touching Ollama.
 * 2. Unmapped bookmarks are batched (10 items) to Ollama with num_ctx=8192, temperature=0.
 * 3. Individual try/catch per batch with retry ensures failures never abort remaining batches.
 * 4. Sanitizes output taxonomy and adapts to existing user folders.
 * 5. Tags every move with its origin ('domain' | 'ollama' | 'heuristic') and detailed stats.
 */
export async function generateAiPlan(
  items: AiBookmarkItem[],
  existingFolderNames: Set<string>,
  config?: OllamaConfig,
  engine: 'semantic' | 'ollama' = 'semantic',
  onProgress?: (current: number, total: number) => void,
  abortSignal?: AbortSignal
): Promise<{ plan: AiProposedPlan; usedOllama: boolean }> {
  let usedOllama = false;
  let viaDomain = 0;
  let viaOllama = 0;
  let viaHeuristic = 0;
  let failedBatches = 0;

  const classifications: Array<{
    id: string;
    suggestedFolder: string;
    suggestedTitle?: string;
    source: 'domain' | 'ollama' | 'heuristic';
  }> = [];

  const classifiedIds = new Set<string>();

  // STEP 1: Pre-filter high-precision domain map FIRST (Runs in < 5ms for 3,500 items)
  for (const item of items) {
    if (abortSignal?.aborted) break;
    const { domain } = cleanUrlAndExtractContext(item.url, item.title);

    let mappedFolder: string | undefined = DOMAIN_SUBFOLDER_MAP[domain];
    if (!mappedFolder) {
      for (const [keyDomain, target] of Object.entries(DOMAIN_SUBFOLDER_MAP)) {
        if (domain.endsWith(`.${keyDomain}`)) {
          mappedFolder = target;
          break;
        }
      }
    }

    if (mappedFolder) {
      classifications.push({
        id: item.id,
        suggestedFolder: mappedFolder,
        suggestedTitle: item.title,
        source: 'domain',
      });
      classifiedIds.add(item.id);
      viaDomain++;
    }
  }

  // STEP 2: Process remaining items through Ollama LLM if requested
  const itemsForLlm = items.filter((item) => !classifiedIds.has(item.id));

  if (engine === 'ollama' && config && itemsForLlm.length > 0 && !abortSignal?.aborted) {
    const OLLAMA_BATCH_SIZE = 10; // Controlled batch size to fit within num_ctx 8192 safely

    for (let i = 0; i < itemsForLlm.length; i += OLLAMA_BATCH_SIZE) {
      if (abortSignal?.aborted) break;

      const batch = itemsForLlm.slice(i, i + OLLAMA_BATCH_SIZE);
      let batchSuccess = false;

      // Try once, with 1 retry on error
      for (let attempt = 0; attempt < 2; attempt++) {
        if (abortSignal?.aborted) break;
        try {
          const prompt = buildCategorizationPrompt(batch);
          const rawResponse = await queryOllama(prompt, config, abortSignal);
          const parsed = JSON.parse(rawResponse);

          if (Array.isArray(parsed.classifications) && parsed.classifications.length > 0) {
            for (const c of parsed.classifications) {
              if (c.id && c.suggestedFolder) {
                classifications.push({
                  id: c.id,
                  suggestedFolder: c.suggestedFolder,
                  suggestedTitle: c.suggestedTitle,
                  source: 'ollama',
                });
                classifiedIds.add(c.id);
                viaOllama++;
              }
            }
            usedOllama = true;
            batchSuccess = true;
            break; // Batch succeeded, exit retry loop
          }
        } catch (err: any) {
          if (abortSignal?.aborted) break;
          if (attempt === 1) {
            console.warn(`Lote ${Math.floor(i / OLLAMA_BATCH_SIZE) + 1} falhou após 2 tentativas. Fallback para heurística:`, err?.message);
            failedBatches++;
          }
        }
      }

      // If batch failed or was incomplete, fallback its remaining items to semantic heuristic
      if (!batchSuccess) {
        for (const item of batch) {
          if (!classifiedIds.has(item.id)) {
            const folder = classifyBookmarkIntelligently(item.title, item.url, item.folderPath);
            classifications.push({
              id: item.id,
              suggestedFolder: folder,
              suggestedTitle: item.title,
              source: 'heuristic',
            });
            classifiedIds.add(item.id);
            viaHeuristic++;
          }
        }
      }

      if (onProgress) {
        onProgress(classifiedIds.size, items.length);
      }
    }
  }

  // STEP 3: Any remaining items (or if engine is 'semantic') processed by semantic engine
  const remaining = items.filter((item) => !classifiedIds.has(item.id));
  if (remaining.length > 0 && !abortSignal?.aborted) {
    for (const item of remaining) {
      const folder = classifyBookmarkIntelligently(item.title, item.url, item.folderPath);
      classifications.push({
        id: item.id,
        suggestedFolder: folder,
        suggestedTitle: item.title,
        source: 'heuristic',
      });
      classifiedIds.add(item.id);
      viaHeuristic++;
    }
  }

  if (onProgress) {
    onProgress(items.length, items.length);
  }

  // STEP 4: Sanitize, normalize, and match against existing user folders
  const foldersSet = new Set<string>();
  const itemMap = new Map(items.map((i) => [i.id, i]));

  const moves = classifications
    .filter((c) => itemMap.has(c.id))
    .map((c) => {
      const item = itemMap.get(c.id)!;
      // 1. Sanitize AI output
      const sanitized = validateAndSanitizeFolder(c.suggestedFolder);
      // 2. Adapt to user's existing folder structure
      const targetFolder = matchWithExistingFolders(sanitized, existingFolderNames);

      foldersSet.add(targetFolder);

      return {
        bookmarkId: c.id,
        bookmarkTitle: c.suggestedTitle || item.title,
        url: item.url,
        targetFolder,
        targetFolderExists: existingFolderNames.has(targetFolder.toLowerCase()),
        source: c.source,
      };
    });

  return {
    plan: {
      suggestedFolders: Array.from(foldersSet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
      moves,
      stats: {
        total: items.length,
        viaDomain,
        viaOllama,
        viaHeuristic,
        failedBatches,
      },
    },
    usedOllama,
  };
}

/**
 * Fast, in-memory catalog diagnostic for the Mini-Agent.
 * Analyzes thousands of bookmarks in milliseconds to provide deep live context.
 */
export function extractBookmarkCatalogSummary(
  items: Array<{ id: string; title: string; url?: string; folderPath?: string; parentId?: string }>,
  folders: Array<{ id: string; title: string; parentId?: string }>,
  parentPathMap?: Record<string, string> | Map<string, string>
): MiniAgentBookmarkContext {
  // Only count actual bookmarks (with url)
  const bookmarkItems = items.filter((i) => Boolean(i.url));
  const totalBookmarks = bookmarkItems.length;
  const totalFolders = folders.length;

  if (totalBookmarks === 0) {
    return {
      totalBookmarks: 0,
      totalFolders,
      unorganizedCount: 0,
      topCategories: [],
      topDomains: [],
      topExistingFolders: [],
    };
  }

  const categoryCounts: Record<string, number> = {};
  const domainCounts: Record<string, number> = {};
  const folderCounts: Record<string, number> = {};
  let unorganizedCount = 0;

  for (const item of bookmarkItems) {
    // 1. Current folder identification
    const rawParentId = (item as any).parentId;
    let folderName = item.folderPath;
    if (!folderName && parentPathMap && rawParentId) {
      folderName = parentPathMap instanceof Map ? parentPathMap.get(rawParentId) : (parentPathMap as any)[rawParentId];
    }
    if (!folderName || folderName === '1' || folderName === '2') {
      folderName = 'Barra de favoritos (Raiz)';
      unorganizedCount++;
    } else {
      const lower = folderName.toLowerCase();
      if (lower.includes('outros') || lower.includes('geral') || lower.includes('all')) {
        unorganizedCount++;
      }
    }

    folderCounts[folderName] = (folderCounts[folderName] || 0) + 1;

    // 2. Domain frequency tracking
    try {
      if (item.url) {
        const parsed = new URL(item.url);
        const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
        if (host && !host.includes('newtab') && !host.includes('extensions')) {
          domainCounts[host] = (domainCounts[host] || 0) + 1;
        }
      }
    } catch {}

    // 3. Fast semantic classification
    const classified = classifyBookmarkIntelligently(item.title || '', item.url || '', folderName);
    const masterCat = classified.split(' / ')[0].trim();
    categoryCounts[masterCat] = (categoryCounts[masterCat] || 0) + 1;
  }

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalBookmarks) * 100),
    }));

  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain, count]) => ({ domain, count }));

  const topExistingFolders = Object.entries(folderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  return {
    totalBookmarks,
    totalFolders,
    unorganizedCount,
    topCategories,
    topDomains,
    topExistingFolders,
  };
}

export interface ActionIntentResult {
  action: 'move_bookmarks';
  targetFolder: string;
  query: string;
  matchedItems: AiBookmarkItem[];
  plan: AiProposedPlan;
}

function toTitleCaseSegment(seg: string): string {
  return seg
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (/^(ia|ccb|roms|cad|3d|diy|pc|ead|cnpj|api|ai|ui|ux|html|css|js|ts|npm)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function formatFolderTitleCase(path: string): string {
  return path
    .split(/[\/\\]+/)
    .map((s) => toTitleCaseSegment(s))
    .join(' / ');
}

/**
 * Natural Language Function Calling Parser for the Mini-Agent Chat.
 * Extracts intent to create folders and move bookmarks from conversational messages
 * or structured JSON action blocks.
 *
 * Examples:
 * - "Crie a pasta Estudos/Inglês e mova todos os links do Duolingo para lá"
 * - "Mova todos os links do GitHub para Dev / Repositórios"
 * - "Crie a pasta Compras/Hardware e mova os links da Kabum para lá"
 */
export function parseChatActionIntent(
  text: string,
  items: AiBookmarkItem[],
  existingFolderNames: Set<string>
): ActionIntentResult | null {
  if (!text || !text.trim()) return null;

  let targetFolder = '';
  let query = '';

  // 1. Check for structured JSON action block
  const jsonBlockMatch = text.match(
    /```(?:action|json)?\s*(\{[\s\S]*?"action"\s*:\s*"move_bookmarks"[\s\S]*?\})\s*```/i
  );
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]);
      if (parsed.targetFolder && parsed.query) {
        targetFolder = parsed.targetFolder;
        query = parsed.query;
      }
    } catch {
      // Fallback to regex
    }
  }

  // 2. Pattern: "crie a pasta X e mova [links de] Y para lá"
  if (!targetFolder || !query) {
    const createAndMove = text.match(
      /(?:crie|criar|nova)\s+(?:a\s+pasta\s+)?["']?([A-Za-z0-9À-ÖØ-öø-ÿ\s/&_-]+?)["']?\s+e\s+(?:mova|mover|coloque|colocar|passe|passar)\s+(?:todos\s+os\s+|os\s+)?(?:links?|favoritos?|sites?)?\s*(?:do|da|de|com|sobre|que\s+tenham)?\s+["']?([A-Za-z0-9À-ÖØ-öø-ÿ\s._-]+?)["']?\s+para\s+(?:l[aá]|ela|essa\s+pasta)/i
    );
    if (createAndMove) {
      targetFolder = createAndMove[1].trim();
      query = createAndMove[2].trim();
    }
  }

  // 3. Pattern: "mova todos os links do Y para [a pasta] X"
  if (!targetFolder || !query) {
    const moveMatch = text.match(
      /(?:mova|mover|coloque|colocar|passe|passar)\s+(?:todos\s+os\s+|os\s+)?(?:links?|favoritos?|sites?)?\s*(?:do|da|de|com|sobre)?\s+["']?([A-Za-z0-9À-ÖØ-öø-ÿ\s._-]+?)["']?\s+para\s+(?:a\s+pasta\s+)?["']?([A-Za-z0-9À-ÖØ-öø-ÿ\s/&_-]+?)["']?$/i
    );
    if (moveMatch) {
      query = moveMatch[1].trim();
      targetFolder = moveMatch[2].trim();
    }
  }

  if (!targetFolder || !query) return null;

  const cleanFolder = formatFolderTitleCase(targetFolder);
  const cleanQuery = query
    .toLowerCase()
    .replace(/^(o|a|os|as|do|da|dos|das|de)\s+/i, '')
    .trim();

  if (!cleanQuery) return null;

  // Match items by domain, title or URL
  const matched = items.filter((item) => {
    const t = (item.title || '').toLowerCase();
    const u = (item.url || '').toLowerCase();
    let d = '';
    try {
      d = new URL(item.url || '').hostname.replace(/^www\./, '').toLowerCase();
    } catch {}
    return t.includes(cleanQuery) || u.includes(cleanQuery) || d.includes(cleanQuery);
  });

  if (matched.length === 0) return null;

  const plan: AiProposedPlan = {
    suggestedFolders: [cleanFolder],
    moves: matched.map((m) => ({
      bookmarkId: m.id,
      bookmarkTitle: m.title || 'Sem título',
      url: m.url,
      targetFolder: cleanFolder,
      targetFolderExists: existingFolderNames.has(cleanFolder.toLowerCase()),
      source: 'heuristic',
    })),
    stats: {
      total: matched.length,
      viaDomain: matched.length,
      viaOllama: 0,
      viaHeuristic: 0,
      failedBatches: 0,
    },
  };

  return {
    action: 'move_bookmarks',
    targetFolder: cleanFolder,
    query: cleanQuery,
    matchedItems: matched,
    plan,
  };
}

