class TaxCalculator:

    @staticmethod
    def kf_yearly_fraction(portfolio_amount):
        slr_percent = 2.69
        rate = max((slr_percent / 100.0) + 0.01, 0.0125)
        decimal = rate * 0.30
        return round(portfolio_amount * decimal, 2)


print(TaxCalculator.kf_yearly_fraction(100000))