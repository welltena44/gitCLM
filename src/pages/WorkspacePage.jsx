import { Link, useLocation } from "react-router-dom";
import "./WorkspacePage.css";

const content = {
  "/gestionnaire": {
    intro: "Retrouvez rapidement les dossiers de votre périmètre et les actions à effectuer.",
    cards: [
      ["Mes contrats", "Consulter les contrats créés ou rattachés à votre périmètre.", "/gestionnaire/contrats", "fa-file-contract"],
      ["Créer un contrat", "Préparer une nouvelle fiche contractuelle.", "/gestionnaire/nouveau", "fa-file-circle-plus"],
      ["Suivi des validations", "Consulter les étapes de validation et les demandes de correction.", "/gestionnaire/validations", "fa-clipboard-check"],
      ["Mes avenants", "Retrouver les avenants associés à vos contrats.", "/gestionnaire/avenants", "fa-file-pen"],
    ],
  },
  "/gestionnaire/contrats": { intro: "Cette vue est prête pour connecter la liste à votre API de contrats.", notice: "La liste réelle dépend de l’endpoint Contrats de votre backend. Aucun contrat fictif n’est affiché.", cards: [["Créer un contrat", "Ouvrir le formulaire de création.", "/gestionnaire/nouveau", "fa-plus"]] },
  "/gestionnaire/nouveau": { intro: "Le formulaire de création sera relié à vos règles de contrat et au backend.", notice: "Le service contractService.js est actuellement vide dans le ZIP fourni. Il faudra définir l’endpoint backend avant d’activer l’enregistrement.", cards: [["Retour à mes contrats", "Revenir à la liste des contrats.", "/gestionnaire/contrats", "fa-arrow-left"]] },
  "/gestionnaire/validations": { intro: "Suivez le traitement des contrats que vous avez soumis.", notice: "Les données de suivi doivent être chargées depuis les endpoints de validation du backend.", cards: [] },
  "/gestionnaire/avenants": { intro: "Retrouvez les avenants associés aux contrats de votre périmètre.", notice: "La gestion des avenants nécessite un endpoint backend dédié.", cards: [] },
  "/gestionnaire/documents": { intro: "Les documents doivent être consultables depuis les fiches de contrat auxquelles ils sont rattachés.", notice: "Aucun document fictif n’est affiché. La connexion nécessite l’API de documents.", cards: [] },
  "/gestionnaire/notifications": { intro: "Les alertes et notifications seront présentées ici.", notice: "La page est prête côté interface ; les notifications réelles nécessitent leur endpoint backend.", cards: [] },
  "/gestionnaire/profil": { intro: "Vos informations de compte sont affichées dans le menu latéral.", notice: "La modification du profil doit être reliée à un endpoint sécurisé du backend.", cards: [] },
  "/valideur": { intro: "Accédez aux décisions qui vous sont attribuées et suivez les dossiers à examiner.", cards: [["Mes validations", "Examiner les décisions qui vous sont attribuées.", "/valideur/validations", "fa-clipboard-check"], ["Contrats à examiner", "Consulter les dossiers soumis à votre avis.", "/valideur/contrats", "fa-file-contract"]] },
  "/valideur/validations": { intro: "Les décisions doivent être limitées aux validations attribuées au valideur connecté.", notice: "Les actions approuver, rejeter ou demander une correction doivent être protégées côté backend.", cards: [] },
  "/valideur/contrats": { intro: "Consultez les contrats nécessitant votre avis.", notice: "La liste sera reliée aux validations assignées au compte connecté.", cards: [] },
  "/valideur/notifications": { intro: "Vos notifications liées aux validations apparaîtront ici.", cards: [] },
  "/valideur/profil": { intro: "Vos informations de compte sont affichées dans le menu latéral.", cards: [] },
  "/juridique": { intro: "Consultez le portefeuille contractuel et suivez les circuits de validation.", cards: [["Tous les contrats", "Consulter les contrats de l’entreprise selon vos droits.", "/juridique/contrats", "fa-file-contract"], ["Règles et seuils", "Accéder aux règles et seuils de validation.", "/juridique/regles", "fa-scale-balanced"], ["Suivi des validations", "Suivre l’avancement des circuits.", "/juridique/validations", "fa-clipboard-check"]] },
  "/juridique/contrats": { intro: "Cette page est destinée à la consultation du portefeuille contractuel.", notice: "Les données seront reliées à l’API de contrats ; aucun contenu fictif n’est présenté.", cards: [] },
  "/juridique/regles": { intro: "Consultez les seuils et règles utilisés dans les circuits de validation.", notice: "Les modifications de seuils doivent être autorisées et contrôlées côté backend.", cards: [] },
  "/juridique/validations": { intro: "Suivez l’avancement des validations des contrats.", notice: "La liste réelle dépend de l’API de validation.", cards: [] },
  "/juridique/versions": { intro: "Consultez l’historique des versions contractuelles.", notice: "Les versions doivent être créées et protégées par le backend.", cards: [] },
  "/juridique/notifications": { intro: "Les notifications juridiques et échéances seront présentées ici.", cards: [] },
  "/juridique/profil": { intro: "Vos informations de compte sont affichées dans le menu latéral.", cards: [] },
};

export default function WorkspacePage() {
  const { pathname } = useLocation();
  const page = content[pathname] || { intro: "Espace de travail CLM.", cards: [] };
  return (
    <div className="workspace-page">
      <div className="workspace-welcome">
        <div className="workspace-welcome-icon"><i className="fa-solid fa-anchor" /></div>
        <div><h2>Bienvenue dans votre espace CLM</h2><p>{page.intro}</p></div>
      </div>
      {page.notice && <div className="workspace-notice"><i className="fa-solid fa-circle-info" /><p>{page.notice}</p></div>}
      {page.cards?.length > 0 && <div className="workspace-cards">
        {page.cards.map(([title, description, to, icon]) => (
          <Link className="workspace-card" to={to} key={to}>
            <span className="workspace-card-icon"><i className={`fa-solid ${icon}`} /></span>
            <span className="workspace-card-copy"><strong>{title}</strong><small>{description}</small><b>Accéder <i className="fa-solid fa-arrow-right" /></b></span>
          </Link>
        ))}
      </div>}
      <div className="workspace-security"><i className="fa-solid fa-shield-halved" /><span><strong>Accès par rôle</strong><small>Les droits doivent être appliqués côté serveur pour chaque donnée et chaque action.</small></span></div>
    </div>
  );
}
