# Mapa do Bairro

  Web App para visualização de pontos de interesse e informação relacionada no mapa.

  O aplicativo faz uso das APIs públicas do Google Maps, a Wikipédia e o Flickr.

  O aplicativo foi construído com ajuda das livrarias: Bootstrap, jQuery e KnockoutJS. Para gestão de pacotes foi usado Yarn.

  Se quiser dar uma olhada: [https://aledruetta.github.io/maps/](https://aledruetta.github.io/maps/)

## Instalação

* Clonar repositório:

  ```bash
  $ git clone git@github.com:aledruetta/mapa-bairro.git
  ```

* Instalar Yarn:

  [https://yarnpkg.com/en/docs/install](https://yarnpkg.com/en/docs/install)

* Instalar dependências:

  ```bash
  $ cd mapa-bairro
  $ yarn install
  $ yarn run dist
  ```

* Executar

  ```bash
  $ firefox dist/index.html &
  ```
