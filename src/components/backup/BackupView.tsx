import React, { useState, useEffect } from 'react';
import {
  HardDriveDownload,
  Camera,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import {
  createLocalSnapshot,
  listSnapshots,
  restoreSnapshot,
  deleteSnapshot,
  SnapshotMetadata,
  exportBookmarksToJson,
  downloadJsonFile,
} from '../../services/backup';
import { downloadMarkdownAwesomeList } from '../../services/backup/markdownExporter';
import { formatDate } from '../../utils/date';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface BackupViewProps {
  tree: BookmarkNode[];
  onRefresh?: () => Promise<void>;
}

export const BackupView: React.FC<BackupViewProps> = ({ tree, onRefresh }) => {
  const [snapshots, setSnapshots] = useState<SnapshotMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Restore confirmation modal
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const load = async () => {
    const list = await listSnapshots();
    setSnapshots(list);
  };

  useEffect(() => {
    load();
  }, []);

  const handleExportJson = () => {
    const jsonStr = exportBookmarksToJson(tree);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJsonFile(jsonStr, `edge-bookmarks-backup-${dateStr}.json`);
    setSuccessMsg('Download do arquivo de backup JSON iniciado!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleExportMarkdown = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadMarkdownAwesomeList(tree, `favoritos_awesome_list_${dateStr}.md`);
    setSuccessMsg('Download da coleção Awesome List em Markdown (.md) iniciado!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCreateSnapshot = async () => {
    setLoading(true);
    await createLocalSnapshot('Snapshot Manual do Usuário');
    await load();
    setLoading(false);
    setSuccessMsg('Snapshot de segurança criado com sucesso no armazenamento local!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleConfirmRestore = async () => {
    if (!confirmRestoreId) return;
    try {
      setRestoring(true);
      setErrorMsg(null);
      await restoreSnapshot(confirmRestoreId);
      if (onRefresh) {
        await onRefresh();
      }
      await load();
      setSuccessMsg('Favoritos restaurados com sucesso a partir do snapshot!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao restaurar snapshot');
    } finally {
      setRestoring(false);
      setConfirmRestoreId(null);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    await deleteSnapshot(id);
    await load();
    setSuccessMsg('Snapshot removido.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <div className="p-5 space-y-6 text-xs max-w-4xl">
      {/* Header card */}
      <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-200 dark:border-sky-800/60 rounded-xl p-4 flex items-start space-x-3">
        <ShieldCheck className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Segurança em Primeiro Lugar
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            O Edge Favorite Manager gera automaticamente snapshots antes de qualquer operação em massa
            (exclusão múltipla, movimentação em lote ou categorização com IA). Você pode restaurar qualquer snapshot instantaneamente com um clique.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 flex items-center space-x-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-semibold mb-1">
              <Download className="w-4 h-4" />
              <span>Exportar Arquivo JSON</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-4">
              Gera um arquivo .json completo contendo toda a hierarquia de pastas, links e metadados para você guardar em seu computador.
            </p>
          </div>
          <button
            onClick={handleExportJson}
            className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Backup JSON</span>
          </button>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
              <FileText className="w-4 h-4" />
              <span>Awesome List (Markdown)</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-4">
              Exporta sua coleção inteira como um README.md formatado com índice e subpastas temáticas pronto para o GitHub, Notion ou Obsidian.
            </p>
          </div>
          <button
            onClick={handleExportMarkdown}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Baixar README.md</span>
          </button>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
              <Camera className="w-4 h-4" />
              <span>Snapshot de Segurança</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-4">
              Salva o estado exato dos seus favoritos no storage interno da extensão para recuperação instantânea em caso de acidente.
            </p>
          </div>
          <button
            onClick={handleCreateSnapshot}
            disabled={loading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <HardDriveDownload className="w-3.5 h-3.5" />
            <span>{loading ? 'Criando Snapshot...' : 'Criar Novo Snapshot'}</span>
          </button>
        </div>
      </div>

      {/* Snapshots history */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Histórico de Snapshots Locais ({snapshots.length})
            </span>
          </div>
          <button
            onClick={load}
            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Atualizar lista</span>
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            Nenhum snapshot gravado ainda. Eles serão criados automaticamente antes de operações em massa ou quando você clicar em criar acima.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-700/40"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {snap.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(snap.timestamp)} • {snap.totalBookmarks} favoritos em {snap.totalFolders} pastas
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                    Salvo Localmente
                  </span>

                  <button
                    onClick={() => setConfirmRestoreId(snap.id)}
                    title="Restaurar este ponto no navegador"
                    className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md transition-colors flex items-center space-x-1 text-[11px] font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    title="Excluir este snapshot"
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmRestoreId)}
        onClose={() => setConfirmRestoreId(null)}
        onConfirm={handleConfirmRestore}
        title="Restaurar Snapshot de Favoritos"
        message="Tem certeza que deseja restaurar seus favoritos para este ponto? Um novo snapshot de segurança do estado atual será gravado automaticamente antes da restauração."
        confirmLabel={restoring ? 'Restaurando...' : 'Sim, Restaurar'}
        isDestructive={false}
      />
    </div>
  );
};
