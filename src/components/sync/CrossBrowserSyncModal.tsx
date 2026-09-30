import React, { useState } from 'react';
import {
  Radio,
  Copy,
  Check,
  RefreshCw,
  Power,
  ShieldCheck,
  ArrowLeftRight,
  Laptop,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useSync } from '../../hooks/useSync';
import { isLegacySyncKey } from '../../services/sync';

interface CrossBrowserSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrossBrowserSyncModal: React.FC<CrossBrowserSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    syncKey,
    status,
    peers,
    autoSync,
    myBrowser,
    connect,
    disconnect,
    generateNewKey,
    setAutoSync,
    triggerMerge,
  } = useSync();

  const [inputKey, setInputKey] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeFeedback, setMergeFeedback] = useState<string | null>(null);

  const handleCopy = () => {
    if (!syncKey) return;
    navigator.clipboard.writeText(syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    if (!connect(inputKey.trim())) {
      setInputError(
        'Esta chave é do formato antigo e não é mais aceita. No outro navegador, clique em "Gerar Nova" e cole aqui a nova chave.'
      );
      return;
    }
    setInputError(null);
    setInputKey('');
  };

  const handleManualMerge = async () => {
    setMerging(true);
    setMergeFeedback(null);
    try {
      await triggerMerge();
      setMergeFeedback('Catálogos enviados! Ambos os navegadores estão mesclando as novidades.');
    } catch (err: any) {
      setMergeFeedback(err?.message || 'Falha ao solicitar mesclagem');
    } finally {
      setTimeout(() => setMerging(false), 3000);
    }
  };

  const otherBrowsersLabel = ['Microsoft Edge', 'Google Chrome', 'Brave Browser']
    .filter((b) => !b.toLowerCase().includes(myBrowser.toLowerCase()))
    .join(' ou ');
  const hasConnectedPeer = peers.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sincronização em Tempo Real (Edge ⇄ Chrome ⇄ Brave)"
      maxWidth="xl"
    >
      <div className="space-y-5 text-xs text-slate-600 dark:text-slate-300">
        {/* Status Live Banner */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            status === 'connected' && hasConnectedPeer
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              : status === 'connected'
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200'
              : status === 'connecting' || status === 'syncing'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  status === 'connected' && hasConnectedPeer
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse'
                    : status === 'connected'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                  <span>
                    {status === 'connected' && hasConnectedPeer
                      ? `🟢 Conectado com ${peers.map((p) => p.browser).join(', ')}`
                      : status === 'connected'
                      ? '🟡 Conectado (Aguardando outro navegador abrir)'
                      : status === 'connecting'
                      ? 'Conectando ao canal seguro...'
                      : status === 'syncing'
                      ? 'Sincronizando favoritos...'
                      : 'Sincronização Desconectada'}
                  </span>
                </h4>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {status === 'connected' && hasConnectedPeer
                    ? `Seu ${myBrowser} e os navegadores pareados (${peers.map((p) => p.browser).join(', ')}) estão conectados ao vivo. Qualquer alteração em um reflete nos demais.`
                    : status === 'connected'
                    ? `Cole a mesma chave no seu ${otherBrowsersLabel} com a extensão aberta para eles se enxergarem.`
                    : 'Use uma Sync Key para conectar seu Microsoft Edge, Google Chrome ou Brave Browser.'}
                </p>
              </div>
            </div>

            {status === 'connected' && (
              <button
                type="button"
                onClick={disconnect}
                className="px-2.5 py-1 text-[11px] bg-slate-200/80 dark:bg-slate-700/80 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-300 rounded-lg transition-colors flex items-center space-x-1"
                title="Desconectar da sincronização"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            )}
          </div>

          {/* Active Peers Pills */}
          {status === 'connected' && (
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Navegadores na Sessão:
              </span>
              <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-sky-600 dark:text-sky-300">
                <Laptop className="w-3 h-3" />
                <span>{myBrowser} (Este navegador)</span>
              </div>
              <ArrowLeftRight className="w-3 h-3 text-slate-400" />
              {hasConnectedPeer ? (
                peers.map((peer) => (
                  <div
                    key={peer.id}
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-medium text-emerald-600 dark:text-emerald-300"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-0.5" />
                    <span>{peer.browser} (Online agora)</span>
                  </div>
                ))
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  Abra o {otherBrowsersLabel} com a extensão para parear
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sync Key Management Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Sua Chave de Sincronização (Sync Key)
            </span>
            <span className="text-[10px] text-slate-400">
              Criptografia de ponta a ponta
            </span>
          </div>

          {syncKey ? (
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-sm tracking-wider text-sky-600 dark:text-sky-400 select-all">
                {syncKey}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium flex items-center space-x-1.5 transition-colors cursor-pointer text-xs shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Chave'}</span>
              </button>
              <button
                type="button"
                onClick={() => generateNewKey()}
                className="px-3 py-2 text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700 hover:bg-slate-300 rounded-lg transition-colors"
                title="Gerar uma nova chave"
              >
                Gerar Nova
              </button>
            </div>
          ) : null}

          {syncKey && isLegacySyncKey(syncKey) && (
            <p
              role="alert"
              className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300"
            >
              Esta chave é do formato antigo e <strong>não é mais aceita</strong>: a sincronização fica desligada até você trocá-la. Clique em <strong>Gerar Nova</strong> e use a nova chave em todos os navegadores.
            </p>
          )}

          {!syncKey && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => generateNewKey()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 text-xs shadow-sm"
              >
                <Radio className="w-4 h-4" />
                <span>Gerar Chave de Sincronização</span>
              </button>
            </div>
          )}

          {/* Connect with existing key form */}
          <form onSubmit={handleConnectInput} className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ou cole uma chave existente (ex: FAV-X7K1-M2QP-8ZRT-HN4W-C9DE)"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value.toUpperCase());
                setInputError(null);
              }}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!inputKey.trim()}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 text-xs"
            >
              Conectar
            </button>
          </form>
          {inputError && (
            <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
              {inputError}
            </p>
          )}
        </div>

        {/* Real-time Automation and Two-Way Merge */}
        {syncKey && status === 'connected' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Sincronização Automática em Tempo Real
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Novos favoritos criados ou apagados no {myBrowser} refletem automaticamente nos demais navegadores pareados.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Manual Two-Way Merge Button */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Mesclar Favoritos Agora (Two-Way Merge)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Compara os navegadores e adiciona o que está em um e falta no outro (sem duplicatas e com snapshot prévio).
                </p>
              </div>
              <button
                type="button"
                onClick={handleManualMerge}
                disabled={merging}
                className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-lg font-medium flex items-center space-x-1.5 transition-all text-xs shrink-0 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${merging ? 'animate-spin' : ''}`} />
                <span>{merging ? 'Sincronizando...' : 'Mesclar Tudo Agora'}</span>
              </button>
            </div>

            {mergeFeedback && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-[11px]">
                {mergeFeedback}
              </div>
            )}
          </div>
        )}

        {/* Safety & Instructions */}
        <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 rounded-xl flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
            <strong>Como usar entre Edge, Chrome e Brave:</strong> Instale a extensão nos seus navegadores. No primeiro, clique em <em>Gerar Chave</em> e copie o código. Nos demais, cole a mesma chave e clique em <em>Conectar</em>. Quando estiverem abertos, eles se conectam ao vivo e sincronizam seus favoritos automaticamente!
          </div>
        </div>
      </div>
    </Modal>
  );
};
