import base64
import os
import requests
from urllib.parse import urljoin

# UUID do connector de dados do SmartView (especifico do ambiente).
# Defina via env SV_CONNECTOR_ID; descubra o seu em GET /api/connectors.
CONNECTOR = os.environ.get("SV_CONNECTOR_ID", "<connector-uuid>")


class SmartViewClient:
    """Cliente Python da API REST do SmartView."""

    def __init__(self, base, user, password, issuer="TOTVS-ADVPL-FWJWT"):
        """
        Inicializa o cliente.

        Args:
            base: URL base da API (ex: https://<smartview-host>)
            user: Usuário para autenticação Basic
            password: Senha para autenticação Basic
            issuer: Issuer JWT (default: TOTVS-ADVPL-FWJWT)
        """
        self.base = base
        self.user = user
        self.password = password
        self.issuer = issuer
        self.s = requests.Session()
        self._authenticated = False

    def _ensure(self):
        """Garante que está autenticado antes de fazer requisições."""
        if not self._authenticated:
            self.login()

    def login(self):
        """Realiza login e seta o token Bearer no session."""
        creds = base64.b64encode(f"{self.user}:{self.password}".encode()).decode()
        url = urljoin(self.base, f"/api/security/token?grant_type=password&issuer={self.issuer}")
        headers = {
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        r = requests.post(url, headers=headers, json={"rememberUser": False})
        r.raise_for_status()

        data = r.json()
        token = data["access_token"]
        self.s.headers["Authorization"] = f"Bearer {token}"
        self._authenticated = True

    def import_report(self, trp_path) -> str:
        """
        Importa um relatório .trp.

        Args:
            trp_path: Caminho do arquivo .trp local

        Returns:
            ID/UUID do relatório importado
        """
        self._ensure()
        url = urljoin(self.base, "/api/resources/report/import")
        with open(trp_path, "rb") as f:
            files = {"file": f}
            r = self.s.post(url, files=files)
        r.raise_for_status()
        data = r.json()
        return data.get("id") or data.get("uuid")

    def rebind(self, uuid, bo_name, bo_filter=None):
        """
        Faz o rebind de um relatório a um novo business object.

        Args:
            uuid: UUID do relatório
            bo_name: Nome do business object
            bo_filter: Filtro opcional
        """
        self._ensure()
        url = urljoin(self.base, f"/api/resources/report/{uuid}/business-object")
        body = {
            "name": bo_name,
            "connectorId": CONNECTOR,
        }
        if bo_filter is not None:
            body["filter"] = bo_filter
        r = self.s.put(url, json=body)
        r.raise_for_status()

    def export_report(self, uuid) -> bytes:
        """
        Exporta um relatório como .trp (ZIP).

        Args:
            uuid: UUID do relatório

        Returns:
            Bytes do arquivo .trp
        """
        self._ensure()
        url = urljoin(self.base, "/api/resources/report/export")
        r = self.s.post(url, json=[uuid])
        r.raise_for_status()
        return r.content

    def delete_report(self, uuid):
        """
        Deleta um relatório.

        Args:
            uuid: UUID do relatório
        """
        self._ensure()
        url = urljoin(self.base, f"/api/resources/report/{uuid}")
        r = self.s.delete(url)
        r.raise_for_status()

    def find_business_objects(self, q) -> list:
        """
        Busca business objects por query.

        Args:
            q: String de busca

        Returns:
            Lista de business objects
        """
        self._ensure()
        url = urljoin(self.base, "/api/connectors/business-objects")
        r = self.s.get(url, params={"q": q})
        r.raise_for_status()
        return r.json()
