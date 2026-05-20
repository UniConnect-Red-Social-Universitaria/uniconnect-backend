/**
 * Servicio de Integración con GitHub
 * Para extraer commits, PRs y despliegues asociados a HUs
 */

import { ApplicationError } from '../../../shared/application-error';
import { TrazabilidadHURecord, TipoRepositorio } from '../domain/scrum-contracts';

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  url: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  url: string;
}

export class GitHubIntegrationService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly org = 'UniConnect-Red-Social-Universitaria';
  private readonly token: string;

  private readonly repositoriosMap: Record<TipoRepositorio, string> = {
    BACKEND: 'uniconnect-backend',
    FRONTEND: 'Frontend-UnConnect',
  };

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN || '';

    if (!this.token) {
      console.warn('[GitHub] Token no configurado. Las búsquedas serán limitadas.');
    }
  }

  /**
   * Buscar commits que mencionen una HU
   * Formato esperado: "HU-001 descripción" en el mensaje
   */
  async buscarCommitsDeHU(codigo: string, repositorio: TipoRepositorio): Promise<GitHubCommit[]> {
    const nombreRepo = this.repositoriosMap[repositorio];

    if (!nombreRepo) {
      throw new ApplicationError(400, `Repositorio inválido: ${repositorio}`);
    }

    try {
      const query = `${codigo} repo:${this.org}/${nombreRepo} type:commit`;
      const url = `${this.baseUrl}/search/commits?q=${encodeURIComponent(query)}&per_page=30`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const commits = data.items || [];

      return commits.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        url: commit.html_url,
      }));
    } catch (error: any) {
      console.error(`[GitHub] Error buscando commits: ${error.message}`);
      return [];
    }
  }

  /**
   * Buscar PRs que mencionen una HU en el título o descripción
   */
  async buscarPRsDeHU(codigo: string, repositorio: TipoRepositorio): Promise<GitHubPullRequest[]> {
    const nombreRepo = this.repositoriosMap[repositorio];

    if (!nombreRepo) {
      throw new ApplicationError(400, `Repositorio inválido: ${repositorio}`);
    }

    try {
      const query = `${codigo} repo:${this.org}/${nombreRepo} type:pr`;
      const url = `${this.baseUrl}/search/issues?q=${encodeURIComponent(query)}&per_page=30`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const prs = data.items || [];

      return prs.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        url: pr.html_url,
      }));
    } catch (error: any) {
      console.error(`[GitHub] Error buscando PRs: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtener detalles de un commit específico
   */
  async obtenerCommit(sha: string, repositorio: TipoRepositorio): Promise<GitHubCommit | null> {
    const nombreRepo = this.repositoriosMap[repositorio];

    if (!nombreRepo) {
      throw new ApplicationError(400, `Repositorio inválido: ${repositorio}`);
    }

    try {
      const url = `${this.baseUrl}/repos/${this.org}/${nombreRepo}/commits/${sha}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`GitHub API: ${response.status} ${response.statusText}`);
      }

      const commit = (await response.json()) as any;

      return {
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        url: commit.html_url,
      };
    } catch (error: any) {
      console.error(`[GitHub] Error obteniendo commit: ${error.message}`);
      return null;
    }
  }

  /**
   * Extraer ID de HU de un mensaje de commit
   * Soporta: "HU-001", "HU-001:", "[HU-001]", etc.
   */
  static extraerCodigoHU(mensaje: string): string | null {
    const regex = /HU-(\d+)/i;
    const match = mensaje.match(regex);
    return match ? `HU-${match[1]}` : null;
  }

  /**
   * Convertir datos de GitHub a formato TrazabilidadHURecord
   */
  static convertirATrazabilidad(
    huId: string,
    repositorio: TipoRepositorio,
    nombreRepositorio: string,
    commit?: GitHubCommit,
    pr?: GitHubPullRequest,
  ): TrazabilidadHURecord {
    return {
      id: '', // Se genera en DB
      huId,
      repositorio,
      nombreRepositorio,
      shaCommit: commit?.sha,
      urlCommit: commit?.url,
      mensajeCommit: commit?.message,
      autorCommit: commit?.author,
      numeroPR: pr?.number,
      urlPR: pr?.url,
      estadoPR: pr?.state,
      extraido: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (this.token) {
      headers.Authorization = `token ${this.token}`;
    }

    return headers;
  }
}
