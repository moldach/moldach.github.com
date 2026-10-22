import Base
import ./BendModel.bend as BendModel

law business_contact:
  {BendModel.destination(BendModel.BusinessEnquiry{}) == BendModel.Contact{} : BendModel.Page}

law hiring_experience:
  {BendModel.destination(BendModel.ReviewExperience{}) == BendModel.Experience{} : BendModel.Page}

law blog_preserved:
  {BendModel.destination(BendModel.ReadArticles{}) == BendModel.Writing{} : BendModel.Page}

law no_payments:
  for page: BendModel.Page
  {BendModel.takes_payment(page) == False{} : Bool}

