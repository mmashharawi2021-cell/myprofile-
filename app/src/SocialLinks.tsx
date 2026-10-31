import { Facebook, Github, Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";
import { siTiktok } from "simple-icons";
import { useSite } from "./content/SiteContent";

// Public profile URLs explicitly approved by the site's owner.
// Keep share-only Facebook URL unchanged; strip tracking from the other profiles.
const profiles = {
  linkedin: "https://www.linkedin.com/in/mohanad-elmashharawi-a4bb23148",
  facebook: "https://www.facebook.com/share/18ytFS2SDE/",
  instagram: "https://www.instagram.com/mohanad.mashharawi",
  tiktok: "https://www.tiktok.com/@mohanad.mashharawi",
};

export default function SocialLinks({ footer = false }: { footer?: boolean }) {
  const { content, generalWhatsApp } = useSite();
  const links = [
    { id: "whatsapp", label: content.contact.whatsappLabel, href: generalWhatsApp, Icon: MessageCircle },
    { id: "linkedin", label: "LinkedIn", href: profiles.linkedin, Icon: Linkedin },
    { id: "facebook", label: "Facebook", href: profiles.facebook, Icon: Facebook },
    { id: "instagram", label: "Instagram", href: profiles.instagram, Icon: Instagram },
    { id: "tiktok", label: "TikTok", href: profiles.tiktok, Icon: null },
    { id: "github", label: content.contact.githubLabel, href: content.identity.github, Icon: Github },
    { id: "email", label: content.contact.emailLabel, href: `mailto:${content.identity.email}`, Icon: Mail },
  ];

  return (
    <nav
      className={footer ? "contact-social footer-social" : "contact-social"}
      aria-label={footer ? "حسابات التواصل الاجتماعي أسفل الموقع" : "حسابات التواصل الاجتماعي"}
    >
      {links.map(({ id, label, href, Icon }) => (
        <a
          key={id}
          href={href}
          {...(id === "email" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        >
          {Icon ? (
            <Icon size={18} aria-hidden="true" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path d={siTiktok.path} />
            </svg>
          )}
          {label}
        </a>
      ))}
    </nav>
  );
}
