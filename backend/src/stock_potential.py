from hcnb_stock_data.models.stock_data import StockData


class StockPotential:

    @staticmethod
    def get_result(stock_data: StockData):
        price = stock_data.price

        back_to_52_week_high_potential = round(((stock_data.fifty_two_week_high / price) - 1) * 100, 2)
        analyst_high_potential = round(((stock_data.target_high_price / price) - 1) * 100, 2)
        analyst_mean_potential = round(((stock_data.target_mean_price / price) - 1) * 100, 2)
        all_time_high_potential = round(((stock_data.all_time_high / price) - 1) * 100, 2)
        average_potential = round((back_to_52_week_high_potential + analyst_high_potential + analyst_mean_potential +
                                   all_time_high_potential) / 4, 2)
        return {
            "back_to_52_week_high_potential": back_to_52_week_high_potential,
            "analyst_high_potential": analyst_high_potential,
            "analyst_mean_potential": analyst_mean_potential,
            "all_time_high_potential": all_time_high_potential,
            "average_potential": average_potential
        }

