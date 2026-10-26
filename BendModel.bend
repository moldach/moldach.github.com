import Base

# Routing model for the planned static consulting website.
type Intent is Data:
  BusinessEnquiry{}
  ReviewExperience{}
  ReadArticles{}

type Page is Data:
  Contact{}
  Experience{}
  Writing{}

def destination(intent: Intent) -> Page:
  match intent:
    case BusinessEnquiry{}:
      Contact{}
    case ReviewExperience{}:
      Experience{}
    case ReadArticles{}:
      Writing{}

def takes_payment(page: Page) -> Bool:
  match page:
    case Contact{}:
      False{}
    case Experience{}:
      False{}
    case Writing{}:
      False{}
