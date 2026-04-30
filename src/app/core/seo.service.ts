import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, startWith } from 'rxjs';

type SeoSchema = 'home' | 'start' | 'legal' | 'content' | 'none';

type SeoData = {
  title: string;
  description: string;
  canonicalPath: string;
  index?: boolean;
  schema?: SeoSchema;
};

const SITE_URL = 'https://medcallon.com.br';
const SITE_NAME = 'MedCallOn';
const DEFAULT_IMAGE = `${SITE_URL}/medcallon.png`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private started = false;

  init(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null)
      )
      .subscribe(() => this.applySeo(this.currentSeoData()));
  }

  private currentSeoData(): SeoData {
    const routeData = this.deepestRoute(this.router.routerState.snapshot.root).data['seo'] as SeoData | undefined;

    return routeData ?? {
      title: 'MedCallOn | Consulta médica online',
      description: 'Consulta médica online com pagamento por Pix e atendimento pela plataforma MedCallOn.',
      canonicalPath: '/',
      index: true,
      schema: 'home'
    };
  }

  private deepestRoute(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }

    return current;
  }

  private applySeo(seo: SeoData): void {
    const canonicalUrl = this.absoluteUrl(seo.canonicalPath === 'current' ? this.currentPath() : seo.canonicalPath);
    const robots = seo.index === false ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

    this.title.setTitle(seo.title);
    this.updateMeta('description', seo.description);
    this.updateMeta('robots', robots);
    this.updateMeta('author', SITE_NAME);
    this.updateMeta('theme-color', '#25c1bb');

    this.updateProperty('og:site_name', SITE_NAME);
    this.updateProperty('og:title', seo.title);
    this.updateProperty('og:description', seo.description);
    this.updateProperty('og:type', 'website');
    this.updateProperty('og:url', canonicalUrl);
    this.updateProperty('og:image', DEFAULT_IMAGE);
    this.updateProperty('og:image:alt', 'MedCallOn consulta medica online');
    this.updateProperty('og:locale', 'pt_BR');

    this.updateMeta('twitter:card', 'summary_large_image');
    this.updateMeta('twitter:title', seo.title);
    this.updateMeta('twitter:description', seo.description);
    this.updateMeta('twitter:image', DEFAULT_IMAGE);
    this.updateMeta('twitter:image:alt', 'MedCallOn consulta medica online');

    this.updateCanonical(canonicalUrl);
    this.updateJsonLd(seo.schema ?? 'none', canonicalUrl);
  }

  private updateMeta(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private updateProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private updateCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private updateJsonLd(schema: SeoSchema, canonicalUrl: string): void {
    const id = 'medcallon-jsonld';
    this.document.getElementById(id)?.remove();

    const payload = this.schemaPayload(schema, canonicalUrl);
    if (!payload) {
      return;
    }

    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(payload);
    this.document.head.appendChild(script);
  }

  private schemaPayload(schema: SeoSchema, canonicalUrl: string): Record<string, unknown> | null {
    if (schema === 'none') {
      return null;
    }

    const organization = {
      '@type': ['Organization', 'MedicalBusiness'],
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: DEFAULT_IMAGE,
      email: 'mmedcallon@gmail.com',
      areaServed: 'BR',
      medicalSpecialty: 'PrimaryCare'
    };

    if (schema === 'legal') {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url: canonicalUrl,
        name: `${SITE_NAME} - documentos legais`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        publisher: { '@id': `${SITE_URL}/#organization` }
      };
    }

    if (schema === 'content') {
      return {
        '@context': 'https://schema.org',
        '@graph': [
          organization,
          {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            name: SITE_NAME,
            url: SITE_URL,
            publisher: { '@id': `${SITE_URL}/#organization` },
            inLanguage: 'pt-BR'
          },
          {
            '@type': 'MedicalWebPage',
            '@id': `${canonicalUrl}#webpage`,
            url: canonicalUrl,
            name: this.title.getTitle(),
            description: this.document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
            isPartOf: { '@id': `${SITE_URL}/#website` },
            publisher: { '@id': `${SITE_URL}/#organization` }
          }
        ]
      };
    }

    return {
      '@context': 'https://schema.org',
      '@graph': [
        organization,
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          name: SITE_NAME,
          url: SITE_URL,
          publisher: { '@id': `${SITE_URL}/#organization` },
          inLanguage: 'pt-BR'
        },
        {
          '@type': 'MedicalWebPage',
          '@id': `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: schema === 'start' ? 'Médicos disponíveis para consulta online' : 'Consulta médica online',
          description:
            schema === 'start'
              ? 'Página para ver médicos disponíveis, criar conta ou entrar na MedCallOn.'
              : 'Consulta médica online com cadastro, pagamento por Pix e atendimento pela plataforma.',
          isPartOf: { '@id': `${SITE_URL}/#website` },
          publisher: { '@id': `${SITE_URL}/#organization` },
          mainEntity: {
            '@type': 'MedicalService',
            name: 'Consulta médica online',
            provider: { '@id': `${SITE_URL}/#organization` },
            areaServed: 'BR',
            availableChannel: {
              '@type': 'ServiceChannel',
              serviceUrl: `${SITE_URL}/comece`,
              serviceType: 'Telemedicine'
            },
            offers: {
              '@type': 'Offer',
              price: '49.90',
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/comece`
            }
          }
        },
        ...(schema === 'home'
          ? [
              {
                '@type': 'FAQPage',
                '@id': `${SITE_URL}/#faq`,
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'Qual o valor da consulta online?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'A consulta online custa R$ 49,90.'
                    }
                  },
                  {
                    '@type': 'Question',
                    name: 'Como funciona o pagamento?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'O pagamento é feito por Pix para liberar o atendimento pela plataforma.'
                    }
                  },
                  {
                    '@type': 'Question',
                    name: 'Como entro na consulta?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Depois do cadastro, horário e pagamento, o paciente acessa a sala de atendimento pela plataforma.'
                    }
                  }
                ]
              }
            ]
          : [])
      ]
    };
  }

  private absoluteUrl(path: string): string {
    if (!path || path === '/') {
      return `${SITE_URL}/`;
    }

    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private currentPath(): string {
    return this.router.url.split('?')[0].split('#')[0] || '/';
  }
}



